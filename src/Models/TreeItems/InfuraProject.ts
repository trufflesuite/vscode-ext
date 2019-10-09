// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Constants } from '../../Constants';
import { IDeployDestination } from '../IDeployDestination';
import { ItemType } from '../ItemType';
import { InfuraNetworkNode } from './InfuraNetworkNode';
import { Project } from './Project';

export class InfuraProject extends Project {
  public readonly projectId: string;

  constructor(label: string, projectId: string) {
    super(
      ItemType.INFURA_PROJECT,
      label,
      Constants.treeItemData.project.infura,
    );

    this.projectId = projectId;
  }

  public toJSON(): { [p: string]: any } {
    const obj = super.toJSON();

    obj.projectId = this.projectId;

    return obj;
  }

  public async getDeployDestinations(): Promise<IDeployDestination[]> {
    const { infura } = Constants.treeItemData.service;

    const getDeployName = (labelNode: string) => [infura.prefix, this.label, labelNode].join('_');

    return Promise.all((this.getChildren() as InfuraNetworkNode[]).map(async (node) => {
      return {
        description: await node.getRPCAddress(),
        detail: infura.label,
        getTruffleNetwork: async () => {
          const truffleNetwork = await node.getTruffleNetwork();
          truffleNetwork.name = getDeployName(node.label);
          return truffleNetwork;
        },
        label: getDeployName(node.label),
        networkId: node.networkId,
        networkType: node.itemType,
      } as IDeployDestination;
    }));
  }
}
