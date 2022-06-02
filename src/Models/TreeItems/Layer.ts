// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {ItemType} from "../ItemType";
import {ExtensionItem, ExtensionItemData} from "./ExtensionItem";

export type LayerTypes = ItemType.INFURA_LAYER;

export abstract class Layer extends ExtensionItem {
  protected constructor(itemType: LayerTypes, label: string, data: ExtensionItemData, description?: string) {
    super(itemType, label, data, description);
  }
}
