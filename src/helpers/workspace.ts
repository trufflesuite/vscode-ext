// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {QuickPickItem, Uri, workspace} from 'vscode';
import {Constants} from '../Constants';
import {Telemetry} from '../TelemetryClient';
import fs from 'fs-extra';
import * as path from 'path';
import glob from 'glob';
import {showQuickPick} from './userInteraction';
import {Entry} from '../views/fileExplorer';

export interface TruffleWorkspace {
  dirName: string;
  workspace: Uri;
  truffleConfig: Uri;
}

export function getWorkspaceRoot(ignoreException = false): string | undefined {
  const workspaceRoot = workspace.workspaceFolders && workspace.workspaceFolders[0].uri.fsPath;

  if (workspaceRoot === undefined && !ignoreException) {
    const error = new Error(Constants.errorMessageStrings.VariableShouldBeDefined('Workspace root'));
    Telemetry.sendException(error);
    throw error;
  }

  return workspaceRoot;
}

export async function getWorkspace(uri?: Uri): Promise<Uri> {
  // Workaround for non URI types. In the future, better to use only Uri as pattern
  uri = uri ? convertEntryToUri(uri) : undefined;

  // If the URI was provided, return the root directory
  if (uri) return getRootDirectoryFromWorkspace(uri);

  // If the URI wasn't provided, retrieves all truffle projects
  const workspaces = await getWorkspacesFolders();

  if (workspaces.length === 1)
    // If there is only one truffle project, return the root directory
    return workspaces[0].workspace;
  // If there is more than one truffle project, a QuickPick is opened with them
  else return await getWorkspaceFromQuickPick(workspaces);
}

export function isWorkspaceOpen(): boolean {
  return !!(workspace.workspaceFolders && workspace.workspaceFolders[0].uri.fsPath);
}

export function getPathByPlataform(workspace: Uri): string {
  return process.platform === 'win32' ? `${workspace.scheme}:${workspace.path}` : workspace.fsPath;
}

async function getWorkspacesFolders(): Promise<TruffleWorkspace[]> {
  const workspaces: TruffleWorkspace[] = [];

  await Promise.all(
    workspace.workspaceFolders!.map(async (ws) => {
      workspaces.push(...(await getTruffleWorkspaces(ws.uri.fsPath)));
    })
  );

  if (workspaces.length === 0) {
    const error = new Error(Constants.errorMessageStrings.VariableShouldBeDefined('Workspace root'));
    Telemetry.sendException(error);
    throw error;
  }

  return workspaces;
}

async function getTruffleWorkspaces(dirPath: string): Promise<TruffleWorkspace[]> {
  const files = glob.sync(`${dirPath}/**/${Constants.defaultTruffleConfigFileName}`, {
    ignore: Constants.workspaceIgnoredFolders,
  });

  return files.map((file) => {
    return {
      dirName: path.dirname(file).split(path.sep).pop()!.toString(),
      workspace: Uri.parse(path.dirname(file)),
      truffleConfig: Uri.parse(file),
    };
  });
}

async function getWorkspaceFromQuickPick(workspaces: TruffleWorkspace[]): Promise<Uri> {
  const folders: QuickPickItem[] = Array.from(workspaces).map((element) => {
    return {
      label: element.dirName,
      detail: process.platform === 'win32' ? element.dirName : element.workspace.fsPath,
    };
  });

  const command = await showQuickPick(folders, {
    ignoreFocusOut: true,
    placeHolder: Constants.placeholders.selectContract,
  });

  return Uri.parse(command.detail!);
}

function convertEntryToUri(uri: Uri): Uri {
  if (uri.fsPath) {
    return uri;
  } else {
    const entry: Entry = JSON.parse(JSON.stringify(uri));
    return Uri.parse(entry.uri.path);
  }
}

function getRootDirectoryFromWorkspace(uri: Uri): Uri {
  if (fs.lstatSync(uri.fsPath).isDirectory()) return Uri.parse(path.resolve(path.join(uri.fsPath, '../')));
  else return Uri.parse(path.resolve(path.join(uri.fsPath, '../..')));
}
