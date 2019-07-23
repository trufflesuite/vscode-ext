// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { commands } from 'vscode';

export enum VSCommands {
  SetContext = 'setContext',
}

export enum CommandContext {
  Enabled = 'azureBlockchainService:enabled',
  IsGanacheRunning = 'azureBlockchainService:isGanacheRunning',
  IsWorkspaceOpen = 'azureBlockchainService:isWorkspaceOpen',
}

export function setCommandContext(key: CommandContext | string, value: boolean): Thenable<boolean | undefined> {
  return commands.executeCommand<boolean>(VSCommands.SetContext, key, value);
}
