// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import { TreeItem } from "vscode";
import { ItemType } from "../ItemType";

export interface IExtensionItem extends TreeItem {
  itemType: ItemType;

  getParent(): IExtensionItem | null;
  getChildren(): IExtensionItem[];
  addParent(parent: IExtensionItem): void;
  addChild(child: IExtensionItem): void;
  removeChild(child: IExtensionItem): void;
  setChildren(children: IExtensionItem[]): void;
  toJSON(): { [key: string]: any };
}
