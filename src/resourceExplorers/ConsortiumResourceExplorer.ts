// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ProgressLocation, QuickPickItem, window } from 'vscode';
import {
  AzureBlockchainServiceClient,
  ConsortiumResource,
  IAzureMemberDto,
  ICreateQuorumMember,
  ISkuDto,
  MemberResource,
} from '../ARMBlockchain';
import { Constants } from '../Constants';
import { showInputBox, showQuickPick } from '../helpers';
import { ConsortiumItem, LocationItem, ResourceGroupItem, SkuItem, SubscriptionItem } from '../Models/QuickPickItems';
import { AzureBlockchainNetworkNode, AzureBlockchainProject, Member } from '../Models/TreeItems';
import { Telemetry } from '../TelemetryClient';
import { AzureBlockchainServiceValidator } from '../validators/AzureBlockchainServiceValidator';
import { AzureResourceExplorer } from './AzureResourceExplorer';

export class ConsortiumResourceExplorer extends AzureResourceExplorer {
  public async createProject(_existingProjects: string[] = []): Promise<AzureBlockchainProject> {
    Telemetry.sendEvent('ConsortiumResourceExplorer.createProject');
    await this.waitForLogin();

    const subscriptionItem = await this.getOrSelectSubscriptionItem();
    const resourceGroupItem = await this.getOrCreateResourceGroupItem(subscriptionItem);

    return this.createAzureConsortium(subscriptionItem, resourceGroupItem);
  }

  public async selectProject(existingProjects: string[] = []): Promise<AzureBlockchainProject> {
    Telemetry.sendEvent('ConsortiumResourceExplorer.selectProject');
    await this.waitForLogin();

    const subscriptionItem = await this.getOrSelectSubscriptionItem();
    const resourceGroupItem = await this.getOrCreateResourceGroupItem(subscriptionItem);

    const pick = await showQuickPick(
      this.getConsortiumItems(subscriptionItem, resourceGroupItem, existingProjects),
      { placeHolder: Constants.placeholders.selectConsortium, ignoreFocusOut: true },
    );

    if (pick instanceof ConsortiumItem) {
      Telemetry.sendEvent('ConsortiumResourceExplorer.selectProject.selectAzureBlockchainProject');
      return this.getAzureConsortium(pick, subscriptionItem, resourceGroupItem);
    } else {
      Telemetry.sendEvent('ConsortiumResourceExplorer.selectProject.createAzureBlockchainProject');
      return this.createAzureConsortium(subscriptionItem, resourceGroupItem);
    }
  }

  public async getAccessKeys(transactionNetworkNode: AzureBlockchainNetworkNode): Promise<string[]> {
    await this.waitForLogin();
    await this._accountApi.waitForFilters();

    const transactionNodeName = transactionNetworkNode.label;
    const subscriptionId = transactionNetworkNode.subscriptionId;
    const resourceGroup = transactionNetworkNode.resourceGroup;
    const memberName = transactionNetworkNode.memberName;

    const subscription = this._accountApi.filters
      .find((filter) => filter.subscription.subscriptionId === subscriptionId);

    if (!subscription) {
      const error = new Error(Constants.errorMessageStrings.NoSubscriptionFoundClick);
      Telemetry.sendException(error);
      throw error;
    }

    const azureClient = await this.getAzureClient(
      new SubscriptionItem('', subscriptionId, subscription.session),
      new ResourceGroupItem(resourceGroup),
    );

    const accessKeys = await azureClient.memberResource.getTransactionNodeAccessKeys(memberName, transactionNodeName);

    return accessKeys.keys.map((key) => key.value);
  }

  private async getAzureClient(subscriptionItem: SubscriptionItem, resourceGroupItem: ResourceGroupItem)
    : Promise<AzureBlockchainServiceClient> {
    return new AzureBlockchainServiceClient(
      subscriptionItem.session.credentials,
      subscriptionItem.subscriptionId,
      resourceGroupItem.label,
      resourceGroupItem.description,
      Constants.azureResourceExplorer.requestBaseUri,
      Constants.azureResourceExplorer.requestApiVersion,
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
      },
    );
  }

  private async getConsortiumItems(
    subscriptionItem: SubscriptionItem,
    resourceGroupItem: ResourceGroupItem,
    excludedItems?: string[],
  ): Promise<QuickPickItem[]> {
    const items: QuickPickItem[] = [];
    const createConsortiumItem: QuickPickItem = { label: '$(plus) Create Consortium' };
    const consortiumItems = await this.loadConsortiumItems(subscriptionItem, resourceGroupItem, excludedItems);

    items.push(createConsortiumItem, ...consortiumItems);

    return items;
  }

  private async loadConsortiumItems(
    subscriptionItem: SubscriptionItem,
    resourceGroupItem: ResourceGroupItem,
    excludedItems: string[] = [],
  ): Promise<ConsortiumItem[]> {
    const azureClient = await this.getAzureClient(subscriptionItem, resourceGroupItem);
    const members: IAzureMemberDto[] = await azureClient.memberResource.getListMember();
    return members
      .map((member) => new ConsortiumItem(
        member.properties.consortium,
        subscriptionItem.subscriptionId,
        resourceGroupItem.label,
        member.name,
        member.properties.dns,
      ))
      .filter((item) => !excludedItems.includes(item.label))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  private async getAzureConsortium(
    consortiumItems: ConsortiumItem,
    subscriptionItem: SubscriptionItem,
    resourceGroupItem: ResourceGroupItem,
  ): Promise<AzureBlockchainProject> {
    const { consortiumName, subscriptionId, resourceGroup, memberName } = consortiumItems;

    const azureClient = await this.getAzureClient(subscriptionItem, resourceGroupItem);
    const azureConsortium = new AzureBlockchainProject(consortiumName, subscriptionId, resourceGroup, memberName);
    const member = new Member(memberName);
    const defaultNetworkNode = this.getTransactionNetworkNode(memberName, subscriptionId, resourceGroup, memberName);
    const transactionNodes = await azureClient.transactionNodeResource.getListTransactionNode(memberName);
    const networkNodes = transactionNodes.map((transactionNode) => {
      return this.getTransactionNetworkNode(transactionNode.name, subscriptionId, resourceGroup, memberName);
    });

    await azureConsortium.setChildren([ member, defaultNetworkNode, ...networkNodes ]);

    return azureConsortium;
  }

  private async createAzureConsortium(subscriptionItem: SubscriptionItem, resourceGroupItem: ResourceGroupItem)
    : Promise<AzureBlockchainProject> {
    const azureClient = await this.getAzureClient(subscriptionItem, resourceGroupItem);
    const consortiumName = await this.getConsortiumName(azureClient.consortiumResource);
    const memberName = await this.getConsortiumMemberName(azureClient.memberResource);
    const protocol = await this.getOrSelectConsortiumProtocol();
    const memberPassword = await this.getConsortiumMemberPassword();
    const consortiumPassword = await this.getConsortiumPassword();
    const region = await this.getOrSelectLocationItem(subscriptionItem);
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

    return window.withProgress({
      location: ProgressLocation.Window,
      title: Constants.statusBarMessages.creatingConsortium,
    }, async () => {
      await azureClient.consortiumResource.createConsortium(memberName, bodyParams);
      const subscriptionId = subscriptionItem.subscriptionId;
      const resourceGroup = resourceGroupItem.label;

      const azureConsortium = new AzureBlockchainProject(consortiumName, subscriptionId, resourceGroup, memberName);
      const member = new Member(memberName);
      const defaultNetworkNode = this.getTransactionNetworkNode(memberName, subscriptionId, resourceGroup, memberName);

      await azureConsortium.setChildren([member, defaultNetworkNode]);

      return azureConsortium;
    });
  }

  private async getConsortiumName(consortiumResource: ConsortiumResource): Promise<string> {
    return showInputBox({
      ignoreFocusOut: true,
      prompt: Constants.paletteLabels.enterConsortiumName,
      validateInput: async (name) => {
        return window.withProgress({
          location: ProgressLocation.Notification,
          title: Constants.informationMessage.consortiumNameValidating,
        }, async () => AzureBlockchainServiceValidator.validateConsortiumName(name, consortiumResource));
      },
    });
  }

  private async getConsortiumMemberName(memberResource: MemberResource): Promise<string> {
    return showInputBox({
      ignoreFocusOut: true,
      prompt: Constants.paletteLabels.enterMemberName,
      validateInput: async (name) => {
        return window.withProgress({
            location: ProgressLocation.Notification,
            title: Constants.informationMessage.memberNameValidating,
          },
          async () => AzureBlockchainServiceValidator.validateMemberName(name, memberResource));
      },
    });
  }

  private async getOrSelectConsortiumProtocol(): Promise<string> {
    const pick = await showQuickPick(
      [{ label: 'Quorum' }] as QuickPickItem[],
      {
        ignoreFocusOut: true,
        placeHolder: Constants.paletteLabels.selectConsortiumProtocol,
      },
    );

    return pick.label;
  }

  private async getConsortiumMemberPassword(): Promise<string> {
    return showInputBox({
      ignoreFocusOut: true,
      password: true,
      prompt: Constants.paletteLabels.enterMemberPassword,
      validateInput: AzureBlockchainServiceValidator.validateAccessPassword,
    });
  }

  private async getConsortiumPassword(): Promise<string> {
    return showInputBox({
      ignoreFocusOut: true,
      password: true,
      prompt: Constants.paletteLabels.enterConsortiumManagementPassword,
      validateInput: AzureBlockchainServiceValidator.validateAccessPassword,
    });
  }

  private async getOrSelectSku(client: AzureBlockchainServiceClient, location: LocationItem): Promise<SkuItem> {
    return showQuickPick(
      this.loadSkuItems(client, location),
      { placeHolder: Constants.paletteLabels.selectConsortiumSku, ignoreFocusOut: true },
    );
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
    memberName: string,
  ): AzureBlockchainNetworkNode {
    const url = transactionNodeName === memberName ?
      `${transactionNodeName}.${Constants.defaultABSHost}:${Constants.defaultABSPort}` :
      `${transactionNodeName}-${memberName}.${Constants.defaultABSHost}:${Constants.defaultABSPort}`;
    return new AzureBlockchainNetworkNode(
      transactionNodeName,
      url,
      '*',
      subscriptionId,
      resourceGroup,
      memberName,
      );
  }
}
