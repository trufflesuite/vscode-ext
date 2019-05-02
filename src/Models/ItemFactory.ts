// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { IExtensionItem } from './IExtensionItem';
import { ItemCreator } from './ItemCreators/ItemCreator';
import { ItemType } from './ItemType';

export namespace ItemFactory {
  const registeredTypes: {[key: number]: ItemCreator} = {};

  export function register(type: ItemType | number, value: ItemCreator): void {
    if (registeredTypes[type]) {
      throw new Error(`Factory already has this item type: ${type}`);
    }

    registeredTypes[type] = value;
  }

  export function create(obj: { [key: string]: any }): IExtensionItem {
    const creator = registeredTypes[obj.itemType];
    if (!creator) {
      throw new Error(`Type ${obj.itemType} doesn't exist in factory`);
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
