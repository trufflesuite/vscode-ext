// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {commands} from 'vscode';

export enum VSCommands {
  SetContext = 'setContext',
}

export enum CommandContext {
  Enabled = 'truffle-vscode:enabled',
  IsGanacheRunning = 'truffle-vscode:isGanacheRunning',
  IsWorkspaceOpen = 'truffle-vscode:isWorkspaceOpen',
}

export function setCommandContext(key: CommandContext | string, value: boolean): Thenable<boolean | undefined> {
  return commands.executeCommand<boolean>(VSCommands.SetContext, key, value);
}
