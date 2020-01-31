// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { QuickPickItem } from 'vscode';
import { AzureBlockchainServiceClient, IAzureBlockchainDataManagerDto } from '../ARMBlockchain';
import { Constants } from '../Constants';
import { showQuickPick } from '../helpers';
import { ItemType } from '../Models/ItemType';
import { BlockchainDataManagerInstanceItem, ResourceGroupItem, SubscriptionItem } from '../Models/QuickPickItems';
import { BlockchainDataManagerInputAndOutput, BlockchainDataManagerNetworkNode, BlockchainDataManagerProject } from '../Models/TreeItems';
import { Telemetry } from '../TelemetryClient';
import { AzureResourceExplorer } from './AzureResourceExplorer';

export class BlockchainDataManagerResourceExplorer extends AzureResourceExplorer {
  public async selectProject(existingProjects: string[] = []): Promise<BlockchainDataManagerProject> {
    Telemetry.sendEvent('BlockchainDataManagerResourceExplorer.selectProject');
    await this.waitForLogin();

    const subscriptionItem = await this.getOrSelectSubscriptionItem();
    const resourceGroupItem = await this.getOrCreateResourceGroupItem(subscriptionItem);
    const azureClient = await this.getAzureClient(subscriptionItem, resourceGroupItem);

    const pick = await showQuickPick(
      this.getBlockchainDataManagerInstanceItems(azureClient, subscriptionItem, resourceGroupItem, existingProjects),
      { placeHolder: Constants.placeholders.selectBlockchainDataManagerInstance, ignoreFocusOut: true },
    );

    if (pick instanceof BlockchainDataManagerInstanceItem) {
      Telemetry.sendEvent('BlockchainDataManagerResourceExplorer.selectProject.selectBlockchainDataManagerProject');
      return this.getBlockchainDataManagerInstance(pick, azureClient);
    } else {
      Telemetry.sendEvent('BlockchainDataManagerResourceExplorer.selectProject.createBlockchainDataManagerProject');
      // TODO: implement createBlockchainDataManagerInstance
      return Promise.resolve({} as BlockchainDataManagerProject);
    }
  }

  private async getBlockchainDataManagerInstanceItems(
    azureClient: AzureBlockchainServiceClient,
    subscriptionItem: SubscriptionItem,
    resourceGroupItem: ResourceGroupItem,
    excludedItems: string[] = [])
  : Promise<QuickPickItem[]> {

    const items: QuickPickItem[] = [];

    // TODO: add logic for create BlockchainDataManager project
    const bdmItems =
      await this.loadBlockchainDataManagerInstanceItem(azureClient, subscriptionItem, resourceGroupItem, excludedItems);

    items.push(...bdmItems);

    return items;
  }

  private async loadBlockchainDataManagerInstanceItem(
    azureClient: AzureBlockchainServiceClient,
    subscriptionItem: SubscriptionItem,
    resourceGroupItem: ResourceGroupItem,
    excludedItems: string[] = [])
  : Promise<BlockchainDataManagerInstanceItem[]> {
    const bdmItems: IAzureBlockchainDataManagerDto[] = await azureClient.bdmResource.getListBlockchainDataManager();

    return bdmItems
      .filter((item) => !excludedItems.includes(item.name))
      .map((item) => new BlockchainDataManagerInstanceItem(
        item.name,
        subscriptionItem.subscriptionId,
        resourceGroupItem.label,
        item.properties.uniqueId,
      ))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  private async getBlockchainDataManagerInstance(
    bdmInstanceItem: BlockchainDataManagerInstanceItem,
    azureClient: AzureBlockchainServiceClient)
  : Promise<BlockchainDataManagerProject> {
    const { bdmName, subscriptionId, resourceGroup } = bdmInstanceItem;

    const bdmProject = new BlockchainDataManagerProject(bdmName, subscriptionId, resourceGroup);
    const bdmApplications = await this.getBlockchainDataManagerApplications(bdmInstanceItem, azureClient);
    const bdmInputs = await this.getBlockchainDataManagerInputs(bdmInstanceItem, azureClient);
    const bdmOutputs = await this.getBlockchainDataManagerOutputs(bdmInstanceItem, azureClient);

    bdmProject.setChildren([...bdmApplications, bdmInputs, bdmOutputs]);

    return bdmProject;
  }

  private async getBlockchainDataManagerApplications(
    bdmInstanceItem: BlockchainDataManagerInstanceItem,
    azureClient: AzureBlockchainServiceClient)
  : Promise<BlockchainDataManagerNetworkNode[]> {
    const { bdmName, subscriptionId, resourceGroup } = bdmInstanceItem;

    const listBDMApplication = await azureClient.bdmResource.getListBlockchainDataManagerApplication(bdmName);

    return listBDMApplication.map((applicaion) => {
      const indexRemovingRoute = applicaion.id.lastIndexOf('/artifacts');
      const url = `${Constants.azureResourceExplorer.portalBasUri}/resource${applicaion.id.slice(0, indexRemovingRoute)}/blockchainapplications`;

      return new BlockchainDataManagerNetworkNode(
        applicaion.name,
        '*',
        subscriptionId,
        resourceGroup,
        ItemType.BLOCKCHAIN_DATA_MANAGER_APPLICATION,
        url);
      });
  }

  private async getBlockchainDataManagerInputs(
    bdmInstanceItem: BlockchainDataManagerInstanceItem,
    azureClient: AzureBlockchainServiceClient)
  : Promise<BlockchainDataManagerInputAndOutput> {
    const { bdmName, subscriptionId, resourceGroup } = bdmInstanceItem;

    const listBDMInput = await azureClient.bdmResource.getListBlockchainDataManagerInput(bdmName);

    const bdmInputs = listBDMInput.map((input) => {
      return new BlockchainDataManagerNetworkNode(
        input.name,
        '*',
        subscriptionId,
        resourceGroup,
        ItemType.BLOCKCHAIN_DATA_MANAGER_INPUT,
        this.getInputUrl(input.properties.dataSource.resourceId));
    });

    const inputs = new BlockchainDataManagerInputAndOutput(
      ItemType.BLOCKCHAIN_DATA_MANAGER_INPUT_GROUP,
      Constants.treeItemData.group.bdm.input.label,
    );

    inputs.setChildren(bdmInputs);

    return inputs;
  }

  private async getBlockchainDataManagerOutputs(
    bdmInstanceItem: BlockchainDataManagerInstanceItem,
    azureClient: AzureBlockchainServiceClient)
  : Promise<BlockchainDataManagerInputAndOutput> {
    const { bdmName, subscriptionId, resourceGroup } = bdmInstanceItem;

    const listBDMOutput = await azureClient.bdmResource.getListBlockchainDataManagerOutput(bdmName);

    const bdmOutputs = listBDMOutput.map((output) => {
      const indexRemovingRoute = output.id.lastIndexOf('/outputs');
      const url = `${Constants.azureResourceExplorer.portalBasUri}/resource${output.id.slice(0, indexRemovingRoute)}/outboundconnections`;
      return new BlockchainDataManagerNetworkNode(
          output.name,
          '*',
          subscriptionId,
          resourceGroup,
          ItemType.BLOCKCHAIN_DATA_MANAGER_OUTPUT,
          url);
    });

    const outputs = new BlockchainDataManagerInputAndOutput(
      ItemType.BLOCKCHAIN_DATA_MANAGER_OUTPUT_GROUP,
      Constants.treeItemData.group.bdm.output.label,
    );

    outputs.setChildren(bdmOutputs);

    return outputs;
  }

  private getInputUrl(url: string): string {
    const firstMark = 'blockchainMembers/';
    const defaultInputTransactionNode = 'transaction-node';
    const nodeName = 'nodeName';

    const idxOfMemberAndTransactionNode = url.lastIndexOf(firstMark) + firstMark.length;
    const relativeInternalPath = url.substring(0, idxOfMemberAndTransactionNode).split('/').join('%2F');
    let memberAndTransactionNode = url.substring(idxOfMemberAndTransactionNode)
      .replace('transactionNodes', nodeName);

    if (memberAndTransactionNode.includes(defaultInputTransactionNode)) {
      const memberName = memberAndTransactionNode.substring(0, memberAndTransactionNode.indexOf('/' + nodeName));
      memberAndTransactionNode = memberAndTransactionNode.replace(defaultInputTransactionNode, memberName);
    }

    return `${Constants.azureResourceExplorer.portalBladeUri}/overview/memberResourceId/` +
      relativeInternalPath + memberAndTransactionNode;
  }

  private async getAzureClient(subscriptionItem: SubscriptionItem, resourceGroupItem: ResourceGroupItem)
    : Promise<AzureBlockchainServiceClient> {
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
      },
    );
  }
}
