// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ProviderResult } from 'vscode';
import { IExtensionItem } from '../Models';
import { IExtensionView } from './IExtensionView';
import { ViewItemFactory } from './ViewItemFactory';

export abstract class ExtensionView<T extends IExtensionItem> implements IExtensionView {
  protected constructor(
    public readonly extensionItem: T,
    protected parent?: IExtensionView | undefined | null,
  ) { }

  public getTreeItem(): Promise<T> | T {
    return this.extensionItem;
  }

  public getChildren(): ProviderResult<IExtensionView[]> {
    const children = this.extensionItem.getChildren().map((item) => ViewItemFactory.create(item));
    children.forEach((child) => child.setParent(this));
    return children;
  }

  public getParent(): ProviderResult<IExtensionView> {
    return this.parent;
  }

  public setParent(element?: IExtensionView): Promise<void> | void {
    this.parent = element;
  }
}
