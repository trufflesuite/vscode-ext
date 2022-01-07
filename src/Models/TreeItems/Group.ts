// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import { ItemType } from "../ItemType";
import { ExtensionItem, ExtensionItemData } from "./ExtensionItem";

export type GroupTypes =
  | ItemType.MEMBER
  | ItemType.BLOCKCHAIN_DATA_MANAGER_INPUT_GROUP
  | ItemType.BLOCKCHAIN_DATA_MANAGER_OUTPUT_GROUP;

export abstract class Group extends ExtensionItem {
  protected constructor(itemType: GroupTypes, label: string, data: ExtensionItemData) {
    super(itemType, label, data);
  }
}
