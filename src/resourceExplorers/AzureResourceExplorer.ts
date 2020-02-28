// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ResourceManagementClient, SubscriptionClient } from 'azure-arm-resource';
import { commands, extensions, ProgressLocation, QuickPickItem, window } from 'vscode';
import { AzureAccount } from '../azure-account.api';
import { Constants } from '../Constants';
import { showInputBox, showQuickPick } from '../helpers';
import { LocationItem, ResourceGroupItem, SubscriptionItem } from '../Models/QuickPickItems';
import { Telemetry } from '../TelemetryClient';
import { AzureBlockchainServiceValidator } from '../validators/AzureBlockchainServiceValidator';

interface ICachedLocationItems {
  locationItems: LocationItem[];
  providerLocationItems: LocationItem[];
}

export class AzureResourceExplorer {
  private static cache: { [subscriptionId: string]: ICachedLocationItems } = {};

  protected readonly _accountApi: AzureAccount;

  constructor() {
    this._accountApi = extensions.getExtension<AzureAccount>('ms-vscode.azure-account')!.exports;
  }

  public async getOrSelectSubscriptionItem(): Promise<SubscriptionItem> {
    return showQuickPick(
      await this.getSubscriptionItems(),
      { placeHolder: Constants.placeholders.selectSubscription, ignoreFocusOut: true },
    );
  }

  public async getOrCreateResourceGroupItem(subscriptionItem: SubscriptionItem): Promise<ResourceGroupItem> {
    const pick = await showQuickPick(
      this.getResourceGroupItems(subscriptionItem),
      { placeHolder: Constants.placeholders.selectResourceGroup, ignoreFocusOut: true },
    );

    if (pick instanceof ResourceGroupItem) {
      Telemetry.sendEvent('AzureResourceExplorer.getOrCreateResourceGroupItem.itemIsResourceGroupItem');
      return pick;
    } else {
      Telemetry.sendEvent('AzureResourceExplorer.getOrCreateResourceGroupItem.createResourceGroupItemSelected');
      return this.createResourceGroup(subscriptionItem);
    }
  }

  public async getOrSelectLocationItem(subscriptionItem: SubscriptionItem, certainLocation?: string[])
  : Promise<LocationItem> {
    const locationItems = await this.getLocationItems(subscriptionItem);
    const filteredLocations = certainLocation?.length
      ? locationItems.filter((location) => certainLocation.includes(location.description))
      : locationItems;

    return showQuickPick(
      filteredLocations,
      { placeHolder: Constants.paletteLabels.selectConsortiumRegion, ignoreFocusOut: true },
    );
  }

  public async waitForLogin(): Promise<boolean> {
    let result = await this._accountApi.waitForLogin();
    if (!result) {
      await commands.executeCommand('azure-account.askForLogin');
      result = await this._accountApi.waitForLogin();
      if (!result) {
        const error = new Error(Constants.errorMessageStrings.WaitForLogin);
        Telemetry.sendException(error);
        throw error;
      }
    }

    return true;
  }

  private async getSubscriptionItems(): Promise<SubscriptionItem[]> {
    await this._accountApi.waitForFilters();

    const subscriptionItems = this._accountApi.filters
      .map((filter) => new SubscriptionItem(
        filter.subscription.displayName || '',
        filter.subscription.subscriptionId || '',
        filter.session,
      ));

    if (subscriptionItems.length === 0) {
      const error = new Error(Constants.errorMessageStrings.NoSubscriptionFoundClick);
      Telemetry.sendException(error);
      throw error;
    }

    return subscriptionItems;
  }

  private async getResourceGroupItems(subscriptionItem: SubscriptionItem): Promise<QuickPickItem[]> {
    const createGroupItem: QuickPickItem = { label: '$(plus) Create Resource Group' };
    const items: QuickPickItem[] = [];
    const resourceManagementClient = await this.getResourceClient(subscriptionItem);
    const resourceGroups = await resourceManagementClient.resourceGroups.list();
    const cachedLocationItems = await this.getCachedLocationItems(subscriptionItem);
    const locationItems = cachedLocationItems.locationItems;
    const resourceItems = resourceGroups.map((resourceGroup) => {
      const location = locationItems.find((locationItem) => locationItem.description === resourceGroup.location);
      return new ResourceGroupItem(
        resourceGroup.name,
        location ? location.description : resourceGroup.location,
      );
    });

    items.push(createGroupItem);
    items.push(...resourceItems);
    return items;
  }

  private async getLocationItems(subscriptionItem: SubscriptionItem): Promise<LocationItem[]> {
    const cachedLocationItems = await this.getCachedLocationItems(subscriptionItem);
    const locationItems = cachedLocationItems.locationItems;
    const providerLocationItems = cachedLocationItems.providerLocationItems;
    return providerLocationItems.length !== 0 ? providerLocationItems : locationItems;
  }

  private async getSubscriptionClient(subscriptionItem: SubscriptionItem)
    : Promise<SubscriptionClient.SubscriptionClient> {
    return new SubscriptionClient.SubscriptionClient(
      subscriptionItem.session.credentials,
      subscriptionItem.session.environment.resourceManagerEndpointUrl,
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

  private async createResourceGroup(subscriptionItem: SubscriptionItem): Promise<ResourceGroupItem> {
    const { resourceGroups } = await this.getResourceClient(subscriptionItem);

    const resourceGroupName = await showInputBox({
      ignoreFocusOut: true,
      placeHolder: Constants.placeholders.resourceGroupName,
      prompt: Constants.paletteLabels.provideResourceGroupName,
      validateInput: (name) => AzureBlockchainServiceValidator.validateResourceGroupName(name, resourceGroups),
    });

    const locationItem = await showQuickPick(
      this.getLocationItems(subscriptionItem),
      { placeHolder: Constants.placeholders.selectRgLocation, ignoreFocusOut: true },
    );

    return window.withProgress({
      location: ProgressLocation.Notification,
      title: `Creating resource group '${resourceGroupName}'`,
    }, async () => {
      if (subscriptionItem.subscriptionId === undefined) {
        const error = new Error(Constants.errorMessageStrings.NoSubscriptionFound);
        Telemetry.sendException(error);
        throw error;
      } else {
        Telemetry.sendEvent('AzureResourceExplorer.createResourceGroup.withProgress.subscriptionIdIsDefined');
        const resourceManagementClient = await this.getResourceClient(subscriptionItem);
        const resourceGroup = await resourceManagementClient.resourceGroups.createOrUpdate(
          resourceGroupName,
          { location: locationItem.description },
        );
        return new ResourceGroupItem(resourceGroup.name, resourceGroup.location);
      }
    });
  }

  private async getCachedLocationItems(subscriptionItem: SubscriptionItem): Promise<ICachedLocationItems> {
    const cache = AzureResourceExplorer.cache;

    if (cache[subscriptionItem.subscriptionId]) {
      return cache[subscriptionItem.subscriptionId];
    }

    const subscriptionClient = await this.getSubscriptionClient(subscriptionItem);
    const resourceManagementClient = await this.getResourceClient(subscriptionItem);
    const locations = await subscriptionClient.subscriptions.listLocations(subscriptionItem.subscriptionId);
    const blockchain = await resourceManagementClient.providers.get(Constants.azureResourceExplorer.providerName);
    const locationItems = locations.map((location) => new LocationItem(location.displayName, location.name));
    const providerLocationItems: LocationItem[] = [];
    const blockchainMember = blockchain.resourceTypes && blockchain.resourceTypes.find((resourceType) => {
      return resourceType.resourceType === Constants.azureResourceExplorer.resourceType;
    });

    if (blockchainMember && blockchainMember.locations) {
      providerLocationItems.push(...locationItems
        .filter((item) => blockchainMember.locations!.includes(item.label))
        .sort((a, b) => a.label.localeCompare(b.label)));
    }

    const cachedLocationItems = {
      locationItems,
      providerLocationItems,
    };

    cache[subscriptionItem.subscriptionId] = cachedLocationItems;

    return cachedLocationItems;
  }
}
