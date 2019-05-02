// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ExtensionItem } from './ExtensionItem';
import { ItemType } from './ItemType';

export class Info extends ExtensionItem {
  constructor(label: string, description?: string) {
    super(ItemType.INFO, label, description);
  }
}
