// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {ProviderResult} from 'vscode';
import {IExtensionItem} from '../Models/TreeItems/IExtensionItem';
import {IExtensionView} from './IExtensionView';
import {ViewItemFactory} from './ViewItemFactory';

export abstract class ExtensionView<T extends IExtensionItem> implements IExtensionView {
  protected constructor(public readonly extensionItem: T, protected parent?: IExtensionView | undefined | null) {}

  public getTreeItem(): Promise<T> | T {
    return this.extensionItem;
  }

  public getChildren(): ProviderResult<IExtensionView[]> {
    const children = this.extensionItem.getChildren().map((item) => ViewItemFactory.create(item));
    children.forEach((child) => void child.setParent(this));
    return children;
  }

  public getParent(): ProviderResult<IExtensionView> {
    return this.parent;
  }

  public setParent(element?: IExtensionView): Promise<void> | void {
    this.parent = element;
  }
}
