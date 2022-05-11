// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Constants} from "../../Constants";
import {IDeployDestination} from "../IDeployDestination";
import {ItemType} from "../ItemType";
import {QuorumNetworkNode} from "./QuorumNetworkNode";
import {Project} from "./Project";

export class QuorumProject extends Project {
  public readonly port: number;

  constructor(label: string, port: number) {
    super(ItemType.QUORUM_PROJECT, label, Constants.treeItemData.project.quorum);

    this.port = port;
  }

  public toJSON(): {[p: string]: any} {
    const obj = super.toJSON();

    obj.port = this.port;

    return obj;
  }

  public async getDeployDestinations(): Promise<IDeployDestination[]> {
    const {quorum} = Constants.treeItemData.service;

    const getDeployName = (labelNode: string) => [quorum.prefix, this.label, labelNode].join("_");

    return Promise.all(
      (this.getChildren() as QuorumNetworkNode[]).map(async (node) => {
        return {
          description: await node.getRPCAddress(),
          detail: quorum.label,
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
