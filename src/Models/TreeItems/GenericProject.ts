// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Constants} from "../../Constants";
import {IDeployDestination} from "../IDeployDestination";
import {ItemType} from "../ItemType";
import {GenericNetworkNode} from "./GenericNetworkNode";
import {Project} from "./Project";

export class GenericProject extends Project {
  public readonly port: number;

  constructor(label: string, port: number) {
    super(ItemType.GENERIC_PROJECT, label, Constants.treeItemData.project.generic);

    this.port = port;
  }

  public toJSON(): {[p: string]: any} {
    const obj = super.toJSON();

    obj.port = this.port;

    return obj;
  }

  public async getDeployDestinations(): Promise<IDeployDestination[]> {
    const {generic} = Constants.treeItemData.service;

    const getDeployName = (labelNode: string) => [generic.prefix, this.label, labelNode].join("_");

    return Promise.all(
      (this.getChildren() as GenericNetworkNode[]).map(async (node) => {
        return {
          description: await node.getRPCAddress(),
          detail: generic.label,
          getTruffleNetwork: async () => {
            const truffleNetwork = await node.getTruffleNetwork();
            truffleNetwork.name = getDeployName(node.label);
            return truffleNetwork;
          },
          label: getDeployName(node.label),
          networkId: node.networkId,
          networkType: node.itemType,
          port: node.port,
        } as IDeployDestination;
      })
    );
  }
}
