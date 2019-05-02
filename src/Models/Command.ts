// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ExtensionItem } from './ExtensionItem';
import { ItemType } from './ItemType';

export class Command extends ExtensionItem {
  constructor(label: string, commandName: string, args?: any[]) {
    super(ItemType.COMMAND, `-> ${label}`);

    this.command = {
      arguments: args,
      command: commandName,
      title: `-> ${label}`,
    };
  }
}
