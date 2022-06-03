// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {IDeployDestination} from "../IDeployDestination";
import {ItemType} from "../ItemType";
import {ExtensionItem, ExtensionItemData} from "./ExtensionItem";
import {NetworkNode} from "./NetworkNode";

export type ProjectTypes = ItemType.LOCAL_PROJECT | ItemType.INFURA_PROJECT | ItemType.GENERIC_PROJECT;

export abstract class Project extends ExtensionItem {
  protected constructor(itemType: ProjectTypes, label: string, data: ExtensionItemData, description?: string) {
    super(itemType, label, data, description);
  }

  public async getRPCAddress(): Promise<string> {
    const networkNodes = this.children.filter((child) => child instanceof NetworkNode) as NetworkNode[];
    if (networkNodes.length === 0) {
      return "";
    }

    // FIXME: suggest user the list of nodes
    return networkNodes[0].getRPCAddress();
  }

  public abstract getDeployDestinations(): Promise<IDeployDestination[]>;
}
