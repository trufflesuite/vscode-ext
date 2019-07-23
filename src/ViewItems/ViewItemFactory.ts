// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { IExtensionItem, ItemType } from '../Models';
import { Telemetry } from '../TelemetryClient';
import { ExtensionView } from './ExtensionView';
import { ViewCreator } from './ViewCreators';

export namespace ViewItemFactory {
  const registeredTypes: {[key: number]: ViewCreator} = {};

  export function register(type: ItemType | number, value: ViewCreator): void {
    if (registeredTypes[type]) {
      const error = new Error(`Factory already has this item type: ${type}`);
      Telemetry.sendException(error);
      throw error;
    }

    registeredTypes[type] = value;
  }

  export function create(extensionItem: IExtensionItem): ExtensionView<IExtensionItem> {
    const creator = registeredTypes[extensionItem.itemType];
    if (!creator) {
      const error = new Error(`Type ${extensionItem.itemType} doesn't exist in factory`);
      Telemetry.sendException(error);
      throw error;
    }

    return creator.create(extensionItem);
  }
}
