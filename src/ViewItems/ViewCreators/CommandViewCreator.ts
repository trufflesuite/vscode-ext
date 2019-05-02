// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Command } from '../../Models';
import { CommandView } from '../CommandView';
import { ViewCreator } from './ViewCreator';

export class CommandViewCreator extends ViewCreator {
  public create(commandItem: Command): CommandView {
    return new CommandView(commandItem);
  }
}
