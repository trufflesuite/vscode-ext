// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ItemType } from '../ItemType';
import { ExtensionItem, ExtensionItemData } from './ExtensionItem';

export type ServiceTypes =
  ItemType.AZURE_BLOCKCHAIN_SERVICE |
  ItemType.LOCAL_SERVICE |
  ItemType.INFURA_SERVICE |
  ItemType.COMMAND;

export abstract class Service extends ExtensionItem {
  protected constructor(itemType: ServiceTypes, label: string, data: ExtensionItemData) {
    super(itemType, label, data);
  }
}
