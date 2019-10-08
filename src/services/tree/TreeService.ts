// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Event, EventEmitter, ProviderResult, TreeDataProvider, window } from 'vscode';
import { IExtensionItem } from '../../Models/TreeItems';
import { IExtensionView, ViewItemFactory } from '../../ViewItems';
import { TreeManager } from './TreeManager';

export class ExtensionTreeService implements TreeDataProvider<IExtensionView> {
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

// tslint:disable-next-line:variable-name
export const TreeService = new ExtensionTreeService();
