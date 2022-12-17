// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {type Event, EventEmitter, type ProviderResult, type TreeDataProvider} from 'vscode';
import type {IExtensionItem} from '@/Models/TreeItems/IExtensionItem';
import {TreeManager} from '@/services/tree/TreeManager';
import {ItemType} from '@/Models/ItemType';
import type {Service} from '@/Models/TreeItems/Service';
import type {Project} from '@/Models/TreeItems/Project';
import type {Nullable} from '@/Models/TreeItems/Nullable';
import type {NetworkNode} from '@/Models/TreeItems/NetworkNode';
import type {Layer} from '@/Models/TreeItems/Layer';
import type {Group} from '@/Models/TreeItems/Group';

interface IExtensionView {
  getTreeItem(): Promise<IExtensionItem> | IExtensionItem;

  getChildren(): ProviderResult<IExtensionView[]>;

  getParent(): ProviderResult<IExtensionView>;
}

// TODO: Use better name, this is actually a tree node, not a view
abstract class ExtensionView<T extends IExtensionItem> implements IExtensionView {
  private parent?: IExtensionView;

  protected constructor(public readonly extensionItem: T) {}

  public getTreeItem(): Promise<T> | T {
    return this.extensionItem;
  }

  public getChildren(): ProviderResult<IExtensionView[]> {
    const children = this.extensionItem.getChildren().map((item) => create(item));
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

class ServiceView extends ExtensionView<Service> {
  constructor(serviceItem: Service) {
    super(serviceItem);
  }
}

export class ProjectView extends ExtensionView<Project> {
  constructor(projectItem: Project) {
    super(projectItem);
  }
}

class NullableView extends ExtensionView<Nullable> {
  constructor(nullableItem: Nullable) {
    super(nullableItem);
  }
}

export class NetworkNodeView extends ExtensionView<NetworkNode> {
  constructor(networkNode: NetworkNode) {
    super(networkNode);
  }
}

class LayerView extends ExtensionView<Layer> {
  constructor(layerItem: Layer) {
    super(layerItem);
  }
}

class GroupView extends ExtensionView<Group> {
  constructor(groupItem: Group) {
    super(groupItem);
  }
}

/**
 * Represents the _Networks_ view data provider.
 */
export class NetworksView implements TreeDataProvider<IExtensionView> {
  public readonly onDidChangeTreeData: Event<IExtensionView>;
  private eventEmitter: EventEmitter<IExtensionView>;

  constructor() {
    this.eventEmitter = new EventEmitter<IExtensionView>();
    this.onDidChangeTreeData = this.eventEmitter.event;
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
      return TreeManager.getItems().map((item) => create(item));
    }

    return element.getChildren();
  }

  public getParent(element: IExtensionView): ProviderResult<IExtensionView> {
    return element.getParent();
  }
}

const registeredTypes: {[key: number]: new (item: any) => ExtensionView<IExtensionItem>} = {
  [ItemType.COMMAND]: ServiceView,
  [ItemType.NULLABLE]: NullableView,

  [ItemType.LOCAL_SERVICE]: ServiceView,
  [ItemType.INFURA_SERVICE]: ServiceView,
  [ItemType.GENERIC_SERVICE]: ServiceView,

  [ItemType.LOCAL_PROJECT]: ProjectView,
  [ItemType.INFURA_PROJECT]: ProjectView,
  [ItemType.GENERIC_PROJECT]: ProjectView,

  [ItemType.LOCAL_NETWORK_NODE]: NetworkNodeView,
  [ItemType.INFURA_NETWORK_NODE]: NetworkNodeView,
  [ItemType.GENERIC_NETWORK_NODE]: NetworkNodeView,

  [ItemType.MEMBER]: GroupView,

  [ItemType.INFURA_LAYER]: LayerView,
};

function create(extensionItem: IExtensionItem): ExtensionView<IExtensionItem> {
  const Creator = registeredTypes[extensionItem.itemType];
  return new Creator(extensionItem);
}
