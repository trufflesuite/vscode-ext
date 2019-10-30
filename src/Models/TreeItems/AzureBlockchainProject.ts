// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Constants } from '../../Constants';
import { IDeployDestination } from '../IDeployDestination';
import { ItemType } from '../ItemType';
import { AzureBlockchainNetworkNode } from './AzureBlockchainNetworkNode';
import { Project } from './Project';
const { project, service } = Constants.treeItemData;

export class AzureBlockchainProject extends Project {
  public readonly subscriptionId: string;
  public readonly resourceGroup: string;
  public readonly memberNames: string[];

  constructor(
    label: string,
    subscriptionId: string,
    resourceGroup: string,
    memberNames: string[],
  ) {
    super(
      ItemType.AZURE_BLOCKCHAIN_PROJECT,
      label,
      project.azure,
    );

    this.subscriptionId = subscriptionId;
    this.resourceGroup = resourceGroup;
    this.memberNames = memberNames;
  }

  public toJSON(): { [p: string]: any } {
    const obj = super.toJSON();

    obj.subscriptionId = this.subscriptionId;
    obj.resourceGroup = this.resourceGroup;
    obj.memberNames = this.memberNames;

    return obj;
  }

  public async getDeployDestinations(): Promise<IDeployDestination[]> {
    const getDeployName = (memberName: string, labelNode: string) =>
      [service.azure.prefix, this.label, memberName, labelNode].join('_');

    const transactionNodes: AzureBlockchainNetworkNode[] = [];
    this.getChildren()
      .forEach((member) => transactionNodes.push(...member.getChildren() as AzureBlockchainNetworkNode[]));

    return Promise.all(transactionNodes.map(async (node) => {
      const deployName = getDeployName(node.memberName, node.label);
      return this.getNetworkNode(deployName, node);
    }));
  }

  private async getNetworkNode(deployName: string, node: AzureBlockchainNetworkNode): Promise<IDeployDestination> {
    return {
      description: await node.getRPCAddress(),
      detail: service.azure.label,
      getTruffleNetwork: async () => {
        const truffleNetwork = await node.getTruffleNetwork();
        truffleNetwork.name = deployName;
        return truffleNetwork;
      },
      label: deployName,
      networkId: node.networkId,
      networkType: node.itemType as number,
    } as IDeployDestination;
  }
}
