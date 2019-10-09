// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Constants } from '../../Constants';
import { IDeployDestination } from '../IDeployDestination';
import { ItemType } from '../ItemType';
import { AzureBlockchainNetworkNode } from './AzureBlockchainNetworkNode';
import { NetworkNode } from './NetworkNode';
import { Project } from './Project';
const { project, service } = Constants.treeItemData;

export class AzureBlockchainProject extends Project {
  public readonly subscriptionId: string;
  public readonly resourceGroup: string;
  public readonly memberName: string;

  constructor(
    label: string,
    subscriptionId: string,
    resourceGroup: string,
    memberName: string,
  ) {
    super(
      ItemType.AZURE_BLOCKCHAIN_PROJECT,
      label,
      project.azure,
    );

    this.subscriptionId = subscriptionId;
    this.resourceGroup = resourceGroup;
    this.memberName = memberName;
  }

  public toJSON(): { [p: string]: any } {
    const obj = super.toJSON();

    obj.subscriptionId = this.subscriptionId;
    obj.resourceGroup = this.resourceGroup;
    obj.memberName = this.memberName;

    return obj;
  }

  public async getDeployDestinations(): Promise<IDeployDestination[]> {
    const getDeployName = (labelNode: string) => [service.azure.prefix, this.label, labelNode].join('_');

    return Promise.all((this.getChildren()
      .filter((child) => child instanceof NetworkNode) as AzureBlockchainNetworkNode[])
      .map(async (node) => {
        return {
          description: await node.getRPCAddress(),
          detail: service.azure.label,
          getTruffleNetwork: async () => {
            const truffleNetwork = await node.getTruffleNetwork();
            truffleNetwork.name = getDeployName(node.label);
            return truffleNetwork;
          },
          label: getDeployName(node.label),
          networkId: node.networkId,
          networkType: node.itemType as number,
        } as IDeployDestination;
      }));
  }
}
