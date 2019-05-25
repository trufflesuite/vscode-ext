// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { workspace } from 'vscode';
import { Constants } from '../Constants';

export function getWorkspaceRoot(): string {
  const workspaceRoot = workspace.workspaceFolders && workspace.workspaceFolders[0].uri.fsPath;

  if (workspaceRoot === undefined) {
    throw Error(Constants.validationMessages.undefinedVariable('Workspace root'));
  }

  return workspaceRoot;
}

export function isWorkspaceOpen(): boolean {
  const workspaceRoot = workspace.workspaceFolders && workspace.workspaceFolders[0].uri.fsPath;

  return workspaceRoot ? true : false;
}
