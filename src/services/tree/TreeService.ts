// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Event, EventEmitter, ProviderResult, TreeDataProvider, window} from 'vscode';
import {IExtensionItem} from '@/Models/TreeItems/IExtensionItem';
import {IExtensionView} from '@/ViewItems/IExtensionView';
import {ViewItemFactory} from '@/ViewItems/ViewItemFactory';
import {TreeManager} from '@/services/tree/TreeManager';

class ExtensionTreeService implements TreeDataProvider<IExtensionView> {
  public readonly onDidChangeTreeData: Event<IExtensionView>;
  private eventEmitter: EventEmitter<IExtensionView>;

  constructor() {
    this.eventEmitter = new EventEmitter<IExtensionView>();
    this.onDidChangeTreeData = this.eventEmitter.event;
  }

  public initialize(viewId: string): void {
    window.registerTreeDataProvider(viewId, this);
  }

  public refresh(element: IExtensionView): void {
    TreeManager.saveState();
    this.eventEmitter.fire(element);
  }

  public getTreeItem(element: IExtensionView): IExtensionItem | Promise<IExtensionItem> {
    return element.getTreeItem();
  }

  public getChildren(element?: IExtensionView): ProviderResult<IExtensionView[]> {
    if (!element) {
      return TreeManager.getItems().map((item) => ViewItemFactory.create(item));
    }

    return element.getChildren();
  }

  public getParent(element: IExtensionView): ProviderResult<IExtensionView> {
    return element.getParent();
  }
}

export const TreeService = new ExtensionTreeService();
