// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as fs from 'fs-extra';
import * as path from 'path';
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

export function createTemporaryDir(projectPath: string): string {
  let temporaryDir = path.join(projectPath, Constants.tempPath);
  let counter = Constants.defaultCounter;
  while (counter--) {
    const result = fs.pathExistsSync(temporaryDir);

    if (result) {
      temporaryDir = temporaryDir.concat(Math.floor(Math.random() * 10).toString());
    } else {
      fs.mkdirSync(temporaryDir);
      break;
    }
  }

  return temporaryDir;
}
