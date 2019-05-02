// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { commands } from 'vscode';

export enum VSCommands {
  SetContext = 'setContext',
}

export enum CommandContext {
  Enabled = 'azureBlockchainService:enabled',
  NodeIsAvailable = 'azureBlockchainService:nodeIsAvailable',
  NpmIsAvailable = 'azureBlockchainService:npmIsAvailable',
  GitIsAvailable = 'azureBlockchainService:gitIsAvailable',
  PythonIsAvailable = 'azureBlockchainService:pythonIsAvailable',
  TruffleIsAvailable = 'azureBlockchainService:truffleIsAvailable',
  GanacheIsAvailable = 'azureBlockchainService:ganacheIsAvailable',
  IsGanacheRunning = 'azureBlockchainService:isGanacheRunning',
  IsWorkspaceOpen = 'azureBlockchainService:isWorkspaceOpen',
}

export function setCommandContext(key: CommandContext | string, value: boolean): Thenable<boolean | undefined> {
  return commands.executeCommand<boolean>(VSCommands.SetContext, key, value);
}
