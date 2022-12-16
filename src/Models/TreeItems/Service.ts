// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import type {ItemType} from '../ItemType';
import {ExtensionItem, type ExtensionItemData} from './ExtensionItem';

export type ServiceTypes =
  | ItemType.LOCAL_SERVICE
  | ItemType.INFURA_SERVICE
  | ItemType.GENERIC_SERVICE
  | ItemType.COMMAND;

export abstract class Service extends ExtensionItem {
  protected constructor(itemType: ServiceTypes, label: string, data: ExtensionItemData) {
    super(itemType, label, data);
  }
}
