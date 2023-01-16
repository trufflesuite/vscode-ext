// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Telemetry} from '@/Telemetry';
import type {ItemCreator} from './ItemCreators/ItemCreator';
import {CommandItemCreator} from './ItemCreators/CommandItemCreator';
import {GenericNetworkNodeItemCreator} from './ItemCreators/GenericNetworkNodeItemCreator';
import {GenericProjectItemCreator} from './ItemCreators/GenericProjectItemCreator';
import {GenericServiceItemCreator} from './ItemCreators/GenericServiceItemCreator';
import {InfuraLayerItemCreator} from './ItemCreators/InfuraLayerItemCreator';
import {InfuraNetworkNodeItemCreator} from './ItemCreators/InfuraNetworkNodeItemCreator';
import {InfuraProjectItemCreator} from './ItemCreators/InfuraProjectItemCreator';
import {InfuraServiceItemCreator} from './ItemCreators/InfuraServiceItemCreator';
import {LocalNetworkNodeItemCreator} from './ItemCreators/LocalNetworkNodeItemCreator';
import {LocalProjectItemCreator} from './ItemCreators/LocalProjectItemCreator';
import {LocalServiceItemCreator} from './ItemCreators/LocalServiceItemCreator';
import {NullableItemCreator} from './ItemCreators/NullableItemCreator';
import {ItemType} from './ItemType';
import type {IExtensionItem} from './TreeItems/IExtensionItem';

export namespace ItemFactory {
  const registeredTypes: {[key: number]: ItemCreator} = {
    [ItemType.COMMAND]: new CommandItemCreator(),
    [ItemType.NULLABLE]: new NullableItemCreator(),

    [ItemType.LOCAL_SERVICE]: new LocalServiceItemCreator(),
    [ItemType.INFURA_SERVICE]: new InfuraServiceItemCreator(),
    [ItemType.GENERIC_SERVICE]: new GenericServiceItemCreator(),

    [ItemType.LOCAL_PROJECT]: new LocalProjectItemCreator(),
    [ItemType.INFURA_PROJECT]: new InfuraProjectItemCreator(),
    [ItemType.GENERIC_PROJECT]: new GenericProjectItemCreator(),

    [ItemType.LOCAL_NETWORK_NODE]: new LocalNetworkNodeItemCreator(),
    [ItemType.INFURA_NETWORK_NODE]: new InfuraNetworkNodeItemCreator(),
    [ItemType.GENERIC_NETWORK_NODE]: new GenericNetworkNodeItemCreator(),
    [ItemType.INFURA_LAYER]: new InfuraLayerItemCreator(),
  };

  export function create(obj: {[key: string]: any}): IExtensionItem {
    let creator = registeredTypes[obj.itemType];
    if (!creator) {
      Telemetry.sendException(new Error(`Type ${obj.itemType} doesn't exist in factory`));
      obj = {itemType: ItemType.NULLABLE, label: obj.label};
      creator = registeredTypes[obj.itemType];
    }

    const extensionItem = creator.create(obj);
    const children = obj.children;

    if (children && Array.isArray(children)) {
      const childrenItems = children.map((child) => ItemFactory.create(child));
      extensionItem.setChildren(childrenItems);
    }

    return extensionItem;
  }
}
