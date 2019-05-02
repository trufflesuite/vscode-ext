// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ResourceManagementClient, SubscriptionClient, SubscriptionModels } from 'azure-arm-resource';
import { commands, extensions, ProgressLocation, QuickPickItem, window } from 'vscode';
import { AzureBlockchainServiceClient, IAzureMemberDto, ICreateQuorumMember } from './ARMBlockchain';
import { AzureAccount } from './azure-account.api';
import { Constants } from './Constants';
import { showInputBox, showQuickPick } from './helpers';
import { AzureConsortium, LocationItem, Member, ResourceGroupItem, SubscriptionItem, TransactionNode } from './Models';
import { getAzureRegions } from './Regions';
import { WestlakeInputValidator } from './validators/WestlakeInputValidator';

export class ConsortiumResourceExplorer {
  private readonly _accountApi: AzureAccount;

  constructor() {
    this._accountApi = extensions.getExtension<AzureAccount>('ms-vscode.azure-account')!.exports;
  }

  public async selectConsortium(childrenFilters?: string[]): Promise<AzureConsortium> {
    await this.waitForLogin();

    const subscriptionItem = await this.getOrSelectSubscriptionItem();
    const resourceGroupItem = await this.getOrSelectResourceGroup(subscriptionItem);
    return await this.getOrSelectConsortiumItem(subscriptionItem, resourceGroupItem, childrenFilters);
  }

  public async createConsortium(): Promise<AzureConsortium> {
    await this.waitForLogin();

    const subscriptionItem = await this.getOrSelectSubscriptionItem();
    const resourceGroupItem = await this.getOrCreateResourceGroup(subscriptionItem);
    return await this.createConsortiumItem(subscriptionItem, resourceGroupItem);
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
      Constants.requestBaseUri,
      Constants.requestApiVersion,
      {
        acceptLanguage: Constants.requestAcceptLanguage,
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

  private async getResourceClient(subscriptionItem: SubscriptionItem)
    : Promise<ResourceManagementClient.ResourceManagementClient> {
    return new ResourceManagementClient.ResourceManagementClient(
      subscriptionItem.session.credentials,
      subscriptionItem.subscriptionId,
      subscriptionItem.session.environment.resourceManagerEndpointUrl,
    );
  }

  private async getOrSelectSubscriptionItem(): Promise<SubscriptionItem> {
    return showQuickPick(
      await this.loadSubscriptionItems(),
      { placeHolder: Constants.placeholders.selectSubscription, ignoreFocusOut: true },
    );
  }

  private async loadSubscriptionItems(): Promise<SubscriptionItem[]> {
    await this._accountApi.waitForFilters();

    const subscriptionItems = this._accountApi.filters
      .map((filter) => new SubscriptionItem(
        filter.subscription.displayName || '',
        filter.subscription.subscriptionId || '',
        filter.session,
      ));

    if (subscriptionItems.length === 0) {
      throw new Error(Constants.errorMessageStrings.NoSubscriptionFoundClick);
    }

    return subscriptionItems;
  }

  private async getOrSelectResourceGroup(subscriptionItem: SubscriptionItem): Promise<ResourceGroupItem> {
    return showQuickPick(
      this.getResourceGroupItems(subscriptionItem),
      { placeHolder: Constants.placeholders.selectResourceGroup, ignoreFocusOut: true },
    );
  }

  private async getOrCreateResourceGroup(subscriptionItem: SubscriptionItem): Promise<ResourceGroupItem> {
    const createGroupItem: QuickPickItem = {
      label: '$(plus) Create Resource Group',
    };
    const items: QuickPickItem[] = [];
    items.push(createGroupItem);
    items.push(...await this.getResourceGroupItems(subscriptionItem));
    const pick = await showQuickPick(
      items,
      { placeHolder: Constants.placeholders.selectResourceGroup, ignoreFocusOut: true },
    );

    if (pick instanceof (ResourceGroupItem)) {
      return pick;
    } else {
      return this.createResourceGroup(subscriptionItem);
    }
  }

  private async createResourceGroup(subscriptionItem: SubscriptionItem): Promise<ResourceGroupItem> {
    const resourceGroupName = await showInputBox({
      ignoreFocusOut: true,
      placeHolder: 'Resource Group Name',
      prompt: 'Provide a resource group name',
      validateInput: WestlakeInputValidator.validateNames,
    });

    const locationItem = await showQuickPick(
      this.getLocationItems(subscriptionItem),
      { placeHolder: 'Select a location to create your Resource Group in...', ignoreFocusOut: true },
    );

    return window.withProgress({
      location: ProgressLocation.Notification,
      title: `Creating resource group '${resourceGroupName}'`,
    }, async () => {
      if (subscriptionItem.subscriptionId === undefined) {
        throw new Error(Constants.errorMessageStrings.NoSubscriptionFound);
      } else {
        const resourceManagementClient = await this.getResourceClient(subscriptionItem);
        const resourceGroup = await resourceManagementClient.resourceGroups.createOrUpdate(
          resourceGroupName,
          { location: locationItem.description },
        );
        return new ResourceGroupItem(resourceGroup.name, resourceGroup.location);
      }
    });
  }

  private async getResourceGroupItems(subscriptionItem: SubscriptionItem): Promise<ResourceGroupItem[]> {
    const resourceManagementClient = await this.getResourceClient(subscriptionItem);
    const resourceGroups = await resourceManagementClient.resourceGroups.list();
    return resourceGroups.map((resourceGroup) => new ResourceGroupItem(resourceGroup.name, resourceGroup.location));
  }

  private async getLocationItems(subscriptionItem: SubscriptionItem): Promise<LocationItem[]> {
    const subscriptionClient = new SubscriptionClient.SubscriptionClient(
      subscriptionItem.session.credentials,
      subscriptionItem.session.environment.resourceManagerEndpointUrl,
    );

    const locations = await subscriptionClient.subscriptions.listLocations(subscriptionItem.subscriptionId);
    return locations.map((location: SubscriptionModels.Location) => new LocationItem(location));
  }

  private async getOrSelectConsortiumItem(
    subscriptionItem: SubscriptionItem,
    resourceGroupItem: ResourceGroupItem,
    childrenFilters?: string[])
    : Promise<AzureConsortium> {
    const consortiumItems = this.getNewConsortiumItems(subscriptionItem, resourceGroupItem, childrenFilters);

    return showQuickPick(consortiumItems,
      { placeHolder: Constants.placeholders.selectConsortium, ignoreFocusOut: true });
  }

  private async getNewConsortiumItems(
    subscriptionItem: SubscriptionItem,
    resourceGroupItem: ResourceGroupItem,
    childrenFilters?: string[])
    : Promise<AzureConsortium[]> {
    const consortiumItems = await this.loadConsortiumItems(subscriptionItem, resourceGroupItem);

    if (childrenFilters) {
      return  consortiumItems.filter((item) => !childrenFilters.includes(item.label));
    }

    return consortiumItems;
  }

  private async loadConsortiumItems(subscriptionItem: SubscriptionItem, resourceGroupItem: ResourceGroupItem)
    : Promise<AzureConsortium[]> {
    const client = await this.getClient(subscriptionItem, resourceGroupItem);

    const members: IAzureMemberDto[] = await client.memberResource.getListMember();
    if (!members.length) {
      throw new Error(`No members found in resource group ${resourceGroupItem.label}.`);
    }

    const consortiumItems = members
      .map((member) => new AzureConsortium(
        member.properties.consortium,
        subscriptionItem.subscriptionId,
        resourceGroupItem.label,
        member.name,
        member.properties.dns,
      ))
      .sort((a, b) => a.label.localeCompare(b.label));

    for (const consortium of consortiumItems) {
      const filterMembers = members.filter((x: IAzureMemberDto) => x.properties.consortium === consortium.label);

      for (const member of filterMembers) {
        const transactionNodes = await client.transactionNodeResource.getListTransactionNode(member.name);
        const memberItem = new Member(member.name);

        await consortium.setChildren([
          memberItem,
          ...transactionNodes.map((transactionNode) => {
            return new TransactionNode(transactionNode.name, transactionNode.properties.dns);
          }),
        ]);
      }
    }

    return consortiumItems;
  }

  private async createConsortiumItem(subscriptionItem: SubscriptionItem, resourceGroupItem: ResourceGroupItem)
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
      [{label: 'Quorum'}],
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
      getAzureRegions(),
      { placeHolder: Constants.paletteWestlakeLabels.selectConsortiumRegion, ignoreFocusOut: true },
    );

    const bodyParams: ICreateQuorumMember = {
      consortiumManagementAccountPassword: memberPassword,
      consortiumName,
      consortiumPassword,
      protocol: protocol.label,
      region: region.key,
    };

    await client.consortiumResource.createConsortium(memberName, bodyParams);

    return new AzureConsortium(consortiumName, subscriptionItem.subscriptionId, resourceGroupItem.label, memberName);
  }

  private async waitForLogin(): Promise<boolean> {
    let result = await this._accountApi.waitForLogin();
    if (!result) {
      await commands.executeCommand('azure-account.askForLogin');
      result = await this._accountApi.waitForLogin();
      if (!result) {
        throw new Error(Constants.errorMessageStrings.WaitForLogin);
      }
    }

    return true;
  }
}
