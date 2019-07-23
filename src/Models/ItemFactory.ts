// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Telemetry } from '../TelemetryClient';
import { IExtensionItem } from './IExtensionItem';
import { ItemCreator } from './ItemCreators/ItemCreator';
import { ItemType } from './ItemType';

export namespace ItemFactory {
  const registeredTypes: {[key: number]: ItemCreator} = {};

  export function register(type: ItemType | number, value: ItemCreator): void {
    if (registeredTypes[type]) {
      const error = new Error(`Factory already has this item type: ${type}`);
      Telemetry.sendException(error);
      throw error;
    }

    registeredTypes[type] = value;
  }

  export function create(obj: { [key: string]: any }): IExtensionItem {
    const creator = registeredTypes[obj.itemType];
    if (!creator) {
      const error = new Error(`Type ${obj.itemType} doesn't exist in factory`);
      Telemetry.sendException(error);
      throw error;
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
