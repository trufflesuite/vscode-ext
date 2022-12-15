// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {IExtensionItem} from '@/Models/TreeItems/IExtensionItem';
import {ExtensionView} from '@/ViewItems/ExtensionView';

export abstract class ViewCreator {
  public abstract create(extensionItem: IExtensionItem): ExtensionView<IExtensionItem>;
}
