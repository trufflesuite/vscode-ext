// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {QuickPickItem, Uri, workspace, WorkspaceFolder} from "vscode";
import {Constants} from "../Constants";
import {Telemetry} from "../TelemetryClient";
import fs from "fs-extra";
import * as path from "path";
import glob from "glob";
import {showQuickPick} from "./userInteraction";
import {Entry} from "../views/fileExplorer";

export interface TruffleWorkspace {
  dirName: string;
  workspace: Uri;
  truffleConfig: Uri;
}

export function getWorkspaceRoot(ignoreException: boolean = false): string | undefined {
  const workspaceRoot = workspace.workspaceFolders && workspace.workspaceFolders[0].uri.fsPath;

  if (workspaceRoot === undefined && !ignoreException) {
    const error = new Error(Constants.errorMessageStrings.VariableShouldBeDefined("Workspace root"));
    Telemetry.sendException(error);
    throw error;
  }

  return workspaceRoot;
}

export async function getWorkspace(uri?: Uri): Promise<Uri> {
  // Workaround for non URI types. In the future, better to use only Uri as pattern
  uri = uri ? convertEntryToUri(uri) : undefined;

  // If the URI was provided, return the root directory
  if (uri) return getWorkspaceFromUri(uri);

  // If the URI wasn't provided, retrieves all truffle projects
  const workspaces = await getWorkspaceFolders();

  if (workspaces.length === 1)
    // If there is only one truffle project, return the root directory
    return workspaces[0]!.uri;
  // If there is more than one truffle project, a QuickPick is opened with them
  else return await getWorkspaceFromQuickPick(workspaces);
}

export function isWorkspaceOpen(): boolean {
  return !!(workspace.workspaceFolders && workspace.workspaceFolders[0].uri.fsPath);
}

export function getPathByPlataform(workspace: Uri): string {
  return process.platform === "win32" ? `${workspace.scheme}:${workspace.path}` : workspace.fsPath;
}

async function getWorkspaceFolders(): Promise<(WorkspaceFolder | undefined)[]> {
  const workspaces: (WorkspaceFolder | undefined)[] = [];

  await Promise.all(
    workspace.workspaceFolders!.map(async (ws) => {
      workspaces.push(...(await getTruffleWorkspaces(ws.uri.fsPath)));
    })
  );

  if (workspaces.length === 0) {
    const error = new Error(Constants.errorMessageStrings.VariableShouldBeDefined("Workspace root"));
    Telemetry.sendException(error);
    throw error;
  }

  return workspaces;
}

async function getTruffleWorkspaces(dirPath: string): Promise<(WorkspaceFolder | undefined)[]> {
  const files = glob.sync(`${dirPath}/**/${Constants.defaultTruffleConfigFileName}`, {
    ignore: Constants.workspaceIgnoredFolders,
  });

  const truffleWorkSpaces: (WorkspaceFolder | undefined)[] = files.map((file) => {
    return workspace.getWorkspaceFolder(Uri.parse(file));
  });

  return truffleWorkSpaces;
}

async function getWorkspaceFromQuickPick(workspaces: (WorkspaceFolder | undefined)[]): Promise<Uri> {
  const folders: QuickPickItem[] = Array.from(workspaces).map((element) => {
    return {
      label: element!.name,
      detail: process.platform === "win32" ? element!.name : element!.uri.fsPath,
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

function getWorkspaceFromUri(uri: Uri): Uri {
  if (fs.lstatSync(uri.fsPath).isDirectory()) return Uri.parse(path.resolve(path.join(uri.fsPath, "../")));
  else return Uri.parse(path.resolve(path.join(uri.fsPath, "../..")));
}
