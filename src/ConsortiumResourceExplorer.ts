// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ProgressLocation, QuickPickItem, window } from 'vscode';
import { AzureBlockchainServiceClient, IAzureMemberDto, ICreateQuorumMember, ISkuDto } from './ARMBlockchain';
import { Constants } from './Constants';
import { showInputBox, showQuickPick } from './helpers';
import {
  AzureConsortium,
  LocationItem,
  Member,
  ResourceGroupItem,
  SkuItem,
  SubscriptionItem,
  TransactionNode,
} from './Models';
import { ConsortiumItem } from './Models/ConsortiumItem';
import { ResourceExplorerAndGenerator } from './ResourceExplorerAndGenerator';
import { Telemetry } from './TelemetryClient';
import { AzureBlockchainServiceValidator } from './validators/AzureBlockchainServiceValidator';

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
      const error = new Error(Constants.errorMessageStrings.NoSubscriptionFoundClick);
      Telemetry.sendException(error);
      throw error;
    }

    const azureClient = await this.getAzureClient(
      new SubscriptionItem(consortium.label, subscriptionId, subscription.session),
      new ResourceGroupItem(resourceGroup),
    );

    const accessKeys = await azureClient.memberResource.getMemberAccessKeys(consortium.getMemberName());

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

  private async getOrCreateConsortiumItem(
    subscriptionItem: SubscriptionItem,
    resourceGroupItem: ResourceGroupItem,
    excludedItems?: string[],
  ): Promise<AzureConsortium> {
    const pick = await showQuickPick(
      this.getConsortiumItems(subscriptionItem, resourceGroupItem, excludedItems),
      { placeHolder: Constants.placeholders.selectConsortium, ignoreFocusOut: true });

    if (pick instanceof ConsortiumItem) {
      Telemetry.sendEvent('ConsortiumResourceExplorer.getOrCreateConsortiumItem.consortiumItemIsSelected');
      return this.getAzureConsortium(pick, subscriptionItem, resourceGroupItem);
    } else {
      Telemetry.sendEvent('ConsortiumResourceExplorer.getOrCreateConsortiumItem.createConsortiumItemIsSelected');
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
  ): Promise<AzureConsortium> {
    const azureClient = await this.getAzureClient(subscriptionItem, resourceGroupItem);
    const transactionNodes = await azureClient
      .transactionNodeResource
      .getListTransactionNode(consortiumItems.memberName);
    const memberItem = new Member(consortiumItems.memberName);

    const azureConsortium = new AzureConsortium(
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

  private async getSkus(
    client: AzureBlockchainServiceClient,
    location: LocationItem)
    : Promise<SkuItem[]> {
    const skus: ISkuDto[] = await client.skuResource.getListSkus();

    const skuItems: SkuItem[] = [];

    for (const sku of skus) {
      if (sku.locations.find((element) => element.toLowerCase() === location.description.toLowerCase())) {
        skuItems.push(new SkuItem(sku.tier, sku.name));
      }
    }

    return skuItems;
  }

  private async createAzureConsortium(subscriptionItem: SubscriptionItem, resourceGroupItem: ResourceGroupItem)
    : Promise<AzureConsortium> {
    const azureClient = await this.getAzureClient(subscriptionItem, resourceGroupItem);
    const { consortiumResource, memberResource } = azureClient;

    const consortiumName = await showInputBox({
      ignoreFocusOut: true,
      prompt: Constants.paletteABSLabels.enterConsortiumName,
      validateInput: async (name) => {
        return await window.withProgress({
          location: ProgressLocation.Notification,
          title: Constants.informationMessage.consortiumNameValidating,
        }, async () => {
          return await AzureBlockchainServiceValidator.validateConsortiumName(name, consortiumResource);
        });
        },
    });

    const memberName = await showInputBox({
      ignoreFocusOut: true,
      prompt: Constants.paletteABSLabels.enterMemberName,
      validateInput: async (name) => {
        return await window.withProgress({
          location: ProgressLocation.Notification,
          title: Constants.informationMessage.memberNameValidating,
        },
          async () => await AzureBlockchainServiceValidator.validateMemberName(name, memberResource));
      },
    });

    const protocol = await showQuickPick(
      [{ label: 'Quorum' }],
      {
        ignoreFocusOut: true,
        placeHolder: Constants.paletteABSLabels.selectConsortiumProtocol,
      },
    );

    const memberPassword = await showInputBox({
      ignoreFocusOut: true,
      password: true,
      prompt: Constants.paletteABSLabels.enterMemberPassword,
      validateInput: AzureBlockchainServiceValidator.validateAccessPassword,
    });

    const consortiumPassword = await showInputBox({
      ignoreFocusOut: true,
      password: true,
      prompt: Constants.paletteABSLabels.enterConsortiumManagementPassword,
      validateInput: AzureBlockchainServiceValidator.validateAccessPassword,
    });

    const region = await showQuickPick(
      this.getLocationItems(subscriptionItem),
      { placeHolder: Constants.paletteABSLabels.selectConsortiumRegion, ignoreFocusOut: true },
    );

    const sku = await showQuickPick(
      this.getSkus(azureClient, region),
      { placeHolder: Constants.paletteABSLabels.selectConsortiumSku, ignoreFocusOut: true },
    );

    const bodyParams: ICreateQuorumMember = {
      consortiumManagementAccountPassword: memberPassword,
      consortiumName,
      consortiumPassword,
      protocol: protocol.label,
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

      return new AzureConsortium(consortiumName, subscriptionItem.subscriptionId, resourceGroupItem.label, memberName);
    });
  }
}
