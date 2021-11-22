// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import { ItemType } from "../ItemType";
import { ExtensionItem, ExtensionItemData } from "./ExtensionItem";

export class Nullable extends ExtensionItem {
  constructor() {
    super(ItemType.NULLABLE, "", {} as ExtensionItemData);
  }
}
