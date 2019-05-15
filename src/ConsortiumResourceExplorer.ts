// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ProgressLocation, QuickPickItem, window } from 'vscode';
import { AzureBlockchainServiceClient, IAzureMemberDto, ICreateQuorumMember } from './ARMBlockchain';
import { Constants } from './Constants';
import { showInputBox, showQuickPick } from './helpers';
import { AzureConsortium, Member, ResourceGroupItem, SubscriptionItem, TransactionNode } from './Models';
import { ConsortiumItem } from './Models/ConsortiumItem';
import { ResourceExplorerAndGenerator } from './ResourceExplorerAndGenerator';
import { WestlakeInputValidator } from './validators/WestlakeInputValidator';

export class ConsortiumResourceExplorer extends ResourceExplorerAndGenerator {
  public async selectOrCreateConsortium(childrenFilters?: string[]): Promise<AzureConsortium> {
    await this.waitForLogin();

    const subscriptionItem = await this.getOrSelectSubscriptionItem();
    const resourceGroupItem = await this.getOrCreateResourceGroupItem(subscriptionItem);

    return this.getOrCreateConsortiumItem(subscriptionItem, resourceGroupItem, childrenFilters);
  }

  public async getAccessKeys(consortium: AzureConsortium): Promise<string[]> {
    await this.waitForLogin();
    await this._accountApi.waitForFilters();

    const subscriptionId = consortium.getSubscriptionId();
    const resourceGroup = consortium.getResourceGroup();

    const subscription = this._accountApi.filters
      .find((filter) => filter.subscription.subscriptionId === subscriptionId);

    if (!subscription) {
      throw new Error(Constants.errorMessageStrings.NoSubscriptionFoundClick);
    }

    const client = await this.getClient(
      new SubscriptionItem(consortium.label, subscriptionId, subscription.session),
      new ResourceGroupItem(resourceGroup),
    );

    const accessKeys = await client.memberResource.getMemberAccessKeys(consortium.getMemberName());

    return accessKeys.keys.map((key) => key.value);
  }

  private async getClient(subscriptionItem: SubscriptionItem, resourceGroupItem: ResourceGroupItem)
    : Promise<AzureBlockchainServiceClient> {
    return new AzureBlockchainServiceClient(
      subscriptionItem.session.credentials,
      subscriptionItem.subscriptionId,
      resourceGroupItem.label,
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

  private async getOrCreateConsortiumItem(
    subscriptionItem: SubscriptionItem,
    resourceGroupItem: ResourceGroupItem,
    excludedItems?: string[],
  ): Promise<AzureConsortium> {
    const pick = await showQuickPick(
      this.getConsortiumItems(subscriptionItem, resourceGroupItem, excludedItems),
      { placeHolder: Constants.placeholders.selectConsortium, ignoreFocusOut: true });

    if (pick instanceof ConsortiumItem) {
      return this.getAzureConsortium(pick, subscriptionItem, resourceGroupItem);
    } else {
      return this.createAzureConsortium(subscriptionItem, resourceGroupItem);
    }
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
    const client = await this.getClient(subscriptionItem, resourceGroupItem);
    const members: IAzureMemberDto[] = await client.memberResource.getListMember();
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
  ): Promise<AzureConsortium> {
    const client = await this.getClient(subscriptionItem, resourceGroupItem);
    const transactionNodes = await client.transactionNodeResource.getListTransactionNode(consortiumItems.memberName);
    const memberItem = new Member(consortiumItems.memberName);

    const azureConsortium =  new AzureConsortium(
      consortiumItems.consortiumName,
      consortiumItems.subscriptionId,
      consortiumItems.resourcesGroup,
      consortiumItems.memberName,
      consortiumItems.url,
    );
    await azureConsortium.setChildren([
      memberItem,
      ...transactionNodes.map((transactionNode) => {
        return new TransactionNode(transactionNode.name, transactionNode.properties.dns);
      }),
    ]);

    return azureConsortium;
  }

  private async createAzureConsortium(subscriptionItem: SubscriptionItem, resourceGroupItem: ResourceGroupItem)
    : Promise<AzureConsortium> {
    const client = await this.getClient(subscriptionItem, resourceGroupItem);

    const consortiumName = await showInputBox({
      ignoreFocusOut: true,
      prompt: Constants.paletteWestlakeLabels.enterConsortiumName,
      validateInput: WestlakeInputValidator.validateNames,
    });

    const memberName = await showInputBox({
      ignoreFocusOut: true,
      prompt: Constants.paletteWestlakeLabels.enterConsortiumMemberName,
      validateInput: WestlakeInputValidator.validateNames,
    });

    const protocol = await showQuickPick(
      [{ label: 'Quorum' }],
      {
        ignoreFocusOut: true,
        placeHolder: Constants.paletteWestlakeLabels.selectConsortiumProtocol,
      },
    );

    const memberPassword = await showInputBox({
      ignoreFocusOut: true,
      password: true,
      prompt: Constants.paletteWestlakeLabels.enterMemberPassword,
      validateInput: WestlakeInputValidator.validateAccessPassword,
    });

    const consortiumPassword = await showInputBox({
      ignoreFocusOut: true,
      password: true,
      prompt: Constants.paletteWestlakeLabels.enterConsortiumManagementPassword,
      validateInput: WestlakeInputValidator.validateAccessPassword,
    });

    const region = await showQuickPick(
      this.getLocationItems(subscriptionItem),
      { placeHolder: Constants.paletteWestlakeLabels.selectConsortiumRegion, ignoreFocusOut: true },
    );

    const bodyParams: ICreateQuorumMember = {
      consortiumManagementAccountPassword: memberPassword,
      consortiumName,
      consortiumPassword,
      protocol: protocol.label,
      region: region.description,
    };

    return window.withProgress({
      location: ProgressLocation.Window,
      title: Constants.statusBarMessages.creatingConsortium,
    }, async () => {
      await client.consortiumResource.createConsortium(memberName, bodyParams);

      return new AzureConsortium(consortiumName, subscriptionItem.subscriptionId, resourceGroupItem.label, memberName);
    });
  }
}
