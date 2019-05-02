// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Command } from '../Models';
import { ExtensionView } from './ExtensionView';

export class CommandView extends ExtensionView<Command> {
  constructor(commandItem: Command) {
    super(commandItem);
  }
}
