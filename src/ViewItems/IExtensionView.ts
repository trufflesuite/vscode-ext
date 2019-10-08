// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ProviderResult } from 'vscode';
import { IExtensionItem } from '../Models/TreeItems';

export interface IExtensionView {
  getTreeItem(): Promise<IExtensionItem> | IExtensionItem;

  getChildren(): ProviderResult<IExtensionView[]>;

  getParent(): ProviderResult<IExtensionView>;
}
