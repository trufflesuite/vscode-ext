// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import open from "open";
import {ProgressLocation, QuickPickItem, window} from "vscode";
import {IAzureConsortiumDto, IAzureConsortiumMemberDto, ICreateQuorumMember, ISkuDto} from "../ARMBlockchain";
import {AzureBlockchainServiceClient} from "../ARMBlockchain/AzureBlockchainServiceClient";
import {Constants} from "../Constants";
import {showInputBox, showQuickPick} from "../helpers";
import {ConsortiumItem, LocationItem, ResourceGroupItem, SkuItem, SubscriptionItem} from "../Models/QuickPickItems";
import {AzureBlockchainNetworkNode, AzureBlockchainProject, Member} from "../Models/TreeItems";
import {Telemetry} from "../TelemetryClient";
import {AzureBlockchainServiceValidator} from "../validators/AzureBlockchainServiceValidator";
import {AzureResourceExplorer} from "./AzureResourceExplorer";

export class ConsortiumResourceExplorer extends AzureResourceExplorer {
  public async createProject(): Promise<AzureBlockchainProject> {
    Telemetry.sendEvent("ConsortiumResourceExplorer.createProject");
    await this.waitForLogin();

    const subscriptionItem = await this.getOrSelectSubscriptionItem();
    const resourceGroupItem = await this.getOrCreateResourceGroupItem(subscriptionItem);
    const azureClient = await this.getAzureClient(subscriptionItem, resourceGroupItem);

    return this.createAzureConsortium(azureClient, subscriptionItem);
  }

  public async selectProject(existingProjects: string[] = []): Promise<AzureBlockchainProject> {
    Telemetry.sendEvent("ConsortiumResourceExplorer.selectProject");
    await this.waitForLogin();

    const subscriptionItem = await this.getOrSelectSubscriptionItem();
    const resourceGroupItem = await this.getOrCreateResourceGroupItem(subscriptionItem);
    const azureClient = await this.getAzureClient(subscriptionItem, resourceGroupItem);

    const pick = await showQuickPick(this.getConsortiumItems(azureClient, existingProjects), {
      placeHolder: Constants.placeholders.selectConsortium,
      ignoreFocusOut: true,
    });

    if (pick instanceof ConsortiumItem) {
      Telemetry.sendEvent("ConsortiumResourceExplorer.selectProject.selectAzureBlockchainProject");
      return this.getAzureConsortium(azureClient, pick);
    } else {
      Telemetry.sendEvent("ConsortiumResourceExplorer.selectProject.createAzureBlockchainProject");
      return this.createAzureConsortium(azureClient, subscriptionItem);
    }
  }

  public async getAccessKeys(transactionNetworkNode: AzureBlockchainNetworkNode): Promise<string[]> {
    await this.waitForLogin();
    await this._accountApi.waitForFilters();

    const transactionNodeName = transactionNetworkNode.label;
    const subscriptionId = transactionNetworkNode.subscriptionId;
    const resourceGroup = transactionNetworkNode.resourceGroup;
    const memberName = transactionNetworkNode.memberName;

    const subscription = this._accountApi.filters.find(
      (filter) => filter.subscription.subscriptionId === subscriptionId
    );

    if (!subscription) {
      const error = new Error(Constants.errorMessageStrings.NoSubscriptionFoundClick);
      Telemetry.sendException(error);
      throw error;
    }

    const azureClient = await this.getAzureClient(
      new SubscriptionItem("", subscriptionId, subscription.session),
      new ResourceGroupItem(resourceGroup)
    );

    const accessKeys = await azureClient.transactionNodeResource.getTransactionNodeAccessKeys(
      memberName,
      transactionNodeName
    );

    return accessKeys.keys.map((key) => key.value);
  }

  public async loadConsortiumItems(
    azureClient: AzureBlockchainServiceClient,
    excludedItems: string[] = []
  ): Promise<ConsortiumItem[]> {
    const consortia: IAzureConsortiumDto[] = await azureClient.consortiumResource.getConsortiaList();

    return consortia
      .filter((item) => !excludedItems.includes(item.consortium))
      .map(
        (consortium) =>
          new ConsortiumItem(
            consortium.consortium,
            azureClient.subscriptionId,
            azureClient.resourceGroup,
            consortium.userName,
            consortium.location,
            consortium.dns
          )
      )
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  public async loadMemberItems(
    azureClient: AzureBlockchainServiceClient,
    memberName: string
  ): Promise<IAzureConsortiumMemberDto[]> {
    const members: IAzureConsortiumMemberDto[] = await azureClient.memberResource.getMemberList(memberName);

    return members.filter((member) => member.status === Constants.consortiumMemberStatuses.ready);
  }

  public async loadTransactionNodeItems(
    azureClient: AzureBlockchainServiceClient,
    memberName: string
  ): Promise<AzureBlockchainNetworkNode[]> {
    const {subscriptionId, resourceGroup} = azureClient;

    try {
      const transactionNodes = await azureClient.transactionNodeResource.getTransactionNodeList(memberName);
      const networkNodes = transactionNodes.map((tn) => {
        return this.getTransactionNetworkNode(tn.name, subscriptionId, resourceGroup, memberName);
      });
      const defaultNode = this.getTransactionNetworkNode(memberName, subscriptionId, resourceGroup, memberName);

      return [defaultNode, ...networkNodes];
    } catch (e) {
      return [];
    }
  }

  public async createAzureConsortium(
    azureClient: AzureBlockchainServiceClient,
    subscriptionItem: SubscriptionItem,
    certainLocation?: string[]
  ): Promise<AzureBlockchainProject> {
    const consortiumName = await this.getConsortiumName(azureClient);
    const memberName = await this.getConsortiumMemberName(azureClient);

    const protocol = await this.getOrSelectConsortiumProtocol();
    const memberPassword = await this.getConsortiumMemberPassword();
    const consortiumPassword = await this.getConsortiumPassword();

    const region = await this.getOrSelectLocationItem(subscriptionItem, certainLocation);
    const sku = await this.getOrSelectSku(azureClient, region);

    const bodyParams: ICreateQuorumMember = {
      consortiumManagementAccountPassword: memberPassword,
      consortiumName,
      consortiumPassword,
      protocol,
      region: region.description,
      sku: {
        name: sku.description,
        tier: sku.label,
      },
    };

    return window.withProgress(
      {
        location: ProgressLocation.Window,
        title: Constants.statusBarMessages.creatingConsortium,
      },
      async () => {
        await this.createConsortium(azureClient, memberName, bodyParams);

        const subscriptionId = azureClient.subscriptionId;
        const resourceGroup = azureClient.resourceGroup;

        const azureMember = new Member(memberName);
        const defaultNetworkNode = this.getTransactionNetworkNode(
          memberName,
          subscriptionId,
          resourceGroup,
          memberName
        );
        azureMember.setChildren([defaultNetworkNode]);

        const azureConsortium = new AzureBlockchainProject(consortiumName, subscriptionId, resourceGroup, [memberName]);
        await azureConsortium.setChildren([azureMember]);

        return azureConsortium;
      }
    );
  }

  private async getAzureConsortium(
    azureClient: AzureBlockchainServiceClient,
    consortiumItems: ConsortiumItem
  ): Promise<AzureBlockchainProject> {
    const {consortiumName, subscriptionId, resourceGroup, memberName} = consortiumItems;

    const memberItems = await this.loadMemberItems(azureClient, memberName);

    const azureMembers = await Promise.all(
      memberItems.map(async (memberItem) => {
        const transactionNodeItems = await this.loadTransactionNodeItems(azureClient, memberItem.name);

        const member = new Member(memberItem.name);
        member.setChildren(transactionNodeItems);

        return member;
      })
    );

    const azureConsortium = new AzureBlockchainProject(
      consortiumName,
      subscriptionId,
      resourceGroup,
      azureMembers.map((mem) => mem.label)
    );
    azureConsortium.setChildren(azureMembers);

    return azureConsortium;
  }

  private getConsortiumName(azureClient: AzureBlockchainServiceClient): Promise<string> {
    return this.getTruffleServiceName(
      Constants.paletteLabels.enterConsortiumName,
      Constants.informationMessage.consortiumNameValidating,
      (name) =>
        AzureBlockchainServiceValidator.validateAzureBlockchainResourceName(name, azureClient.consortiumResource)
    );
  }

  private getConsortiumMemberName(azureClient: AzureBlockchainServiceClient): Promise<string> {
    return this.getTruffleServiceName(
      Constants.paletteLabels.enterMemberName,
      Constants.informationMessage.memberNameValidating,
      (name) => AzureBlockchainServiceValidator.validateAzureBlockchainResourceName(name, azureClient.memberResource)
    );
  }

  private async getOrSelectConsortiumProtocol(): Promise<string> {
    const pick = await showQuickPick([{label: "Quorum"}] as QuickPickItem[], {
      ignoreFocusOut: true,
      placeHolder: Constants.paletteLabels.selectConsortiumProtocol,
    });

    return pick.label;
  }

  private getConsortiumMemberPassword(): Promise<string> {
    return showInputBox({
      ignoreFocusOut: true,
      password: true,
      prompt: Constants.paletteLabels.enterMemberPassword,
      validateInput: AzureBlockchainServiceValidator.validateAccessPassword,
    });
  }

  private getConsortiumPassword(): Promise<string> {
    return showInputBox({
      ignoreFocusOut: true,
      password: true,
      prompt: Constants.paletteLabels.enterConsortiumManagementPassword,
      validateInput: AzureBlockchainServiceValidator.validateAccessPassword,
    });
  }

  private async getOrSelectSku(client: AzureBlockchainServiceClient, location: LocationItem): Promise<SkuItem> {
    return showQuickPick(this.loadSkuItems(client, location), {
      placeHolder: Constants.paletteLabels.selectConsortiumSku,
      ignoreFocusOut: true,
    });
  }

  private async loadSkuItems(client: AzureBlockchainServiceClient, location: LocationItem): Promise<SkuItem[]> {
    const skus: ISkuDto[] = await client.skuResource.getListSkus();
    const skuItems: SkuItem[] = [];

    for (const sku of skus) {
      if (sku.locations.find((element) => element.toLowerCase() === location.description.toLowerCase())) {
        skuItems.push(new SkuItem(sku.tier, sku.name));
      }
    }

    return skuItems;
  }

  private getTransactionNetworkNode(
    transactionNodeName: string,
    subscriptionId: string,
    resourceGroup: string,
    memberName: string
  ): AzureBlockchainNetworkNode {
    const url =
      transactionNodeName === memberName
        ? `${transactionNodeName}.${Constants.defaultABSHost}:${Constants.defaultABSPort}`
        : `${transactionNodeName}-${memberName}.${Constants.defaultABSHost}:${Constants.defaultABSPort}`;
    return new AzureBlockchainNetworkNode(transactionNodeName, url, "*", subscriptionId, resourceGroup, memberName);
  }

  private async getAzureClient(
    subscriptionItem: SubscriptionItem,
    resourceGroupItem: ResourceGroupItem
  ): Promise<AzureBlockchainServiceClient> {
    return new AzureBlockchainServiceClient(
      subscriptionItem.session.credentials,
      subscriptionItem.subscriptionId,
      resourceGroupItem.label,
      resourceGroupItem.description,
      Constants.azureResourceExplorer.requestBaseUri,
      {
        acceptLanguage: Constants.azureResourceExplorer.requestAcceptLanguage,
        filters: [],
        generateClientRequestId: true,
        longRunningOperationRetryTimeout: 30,
        noRetryPolicy: false,
        requestOptions: {
          customHeaders: {},
        },
        rpRegistrationRetryTimeout: 30,
      }
    );
  }

  private async getConsortiumItems(
    azureClient: AzureBlockchainServiceClient,
    excludedItems?: string[]
  ): Promise<QuickPickItem[]> {
    const items: QuickPickItem[] = [];
    const createConsortiumItem: QuickPickItem = {label: "$(plus) Create Consortium"};
    const consortiumItems = await this.loadConsortiumItems(azureClient, excludedItems);

    items.push(createConsortiumItem, ...consortiumItems);

    return items;
  }

  private async createConsortium(
    azureClient: AzureBlockchainServiceClient,
    memberName: string,
    bodyParams: ICreateQuorumMember
  ): Promise<void> {
    await azureClient.consortiumResource.createConsortium(memberName, bodyParams);
    open(
      `${Constants.azureResourceExplorer.portalBasUri}/resource/subscriptions/${azureClient.subscriptionId}` +
        `/resourceGroups/${azureClient.resourceGroup}/providers/Microsoft.Blockchain/blockchainMembers/${memberName}`
    );
  }

  private getTruffleServiceName(
    prompt: string,
    notificationTitle: string,
    validateInput: (value: string) => Promise<string | undefined | null>
  ): Promise<string> {
    return showInputBox({
      ignoreFocusOut: true,
      prompt,
      validateInput: async (name) => {
        return window.withProgress({location: ProgressLocation.Notification, title: notificationTitle}, async () =>
          validateInput(name)
        );
      },
    });
  }
}
