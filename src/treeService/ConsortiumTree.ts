// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Event, EventEmitter, ProviderResult, TreeDataProvider } from 'vscode';
import { IExtensionItem } from '../Models';
import { IExtensionView, ViewItemFactory } from '../ViewItems';
import { ConsortiumTreeManager } from './ConsortiumTreeManager';

export class ConsortiumTree implements TreeDataProvider<IExtensionView> {
  public _onDidChangeTreeData: EventEmitter<IExtensionView> = new EventEmitter<IExtensionView>();
  public readonly onDidChangeTreeData: Event<IExtensionView> = this._onDidChangeTreeData.event;

  constructor(private readonly treeManager: ConsortiumTreeManager) {}

  public refresh(element: IExtensionView): void {
    this.treeManager.saveState();
    this._onDidChangeTreeData.fire(element);
  }

  public getTreeItem(element: IExtensionView): IExtensionItem | Promise<IExtensionItem> {
    return element.getTreeItem();
  }

  public getChildren(element?: IExtensionView): ProviderResult<IExtensionView[]> {
    if (!element) {
      return this.showConsortiumList();
    }

    return element.getChildren();
  }

  public getParent(element: IExtensionView): ProviderResult<IExtensionView> {
    return element.getParent();
  }

  private showConsortiumList(): IExtensionView[] {
      return this.treeManager.getItems(true).map((item) => ViewItemFactory.create(item));
  }
}
