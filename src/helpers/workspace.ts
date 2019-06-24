// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { workspace } from 'vscode';
import { Constants } from '../Constants';

export function getWorkspaceRoot(ignoreException: boolean = false): string | undefined {
  const workspaceRoot = workspace.workspaceFolders && workspace.workspaceFolders[0].uri.fsPath;

  if (workspaceRoot === undefined && !ignoreException) {
    throw Error(Constants.validationMessages.undefinedVariable('Workspace root'));
  }

  return workspaceRoot;
}

export function isWorkspaceOpen(): boolean {
  return !!(workspace.workspaceFolders && workspace.workspaceFolders[0].uri.fsPath);
}
