// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Uri, workspace} from "vscode";
import {Constants} from "../Constants";
import {Telemetry} from "../TelemetryClient";
import * as path from "path";
import glob from "glob";

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

export async function getWorkspaces(): Promise<TruffleWorkspace[]> {
  const workspaces: TruffleWorkspace[] = [];

  await Promise.all(
    workspace.workspaceFolders!.map(async (ws) => {
      workspaces.push(...(await getWorkspaceFiles(ws.uri.fsPath)));
    })
  );

  if (workspaces.length === 0) {
    const error = new Error(Constants.errorMessageStrings.VariableShouldBeDefined("Workspace root"));
    Telemetry.sendException(error);
    throw error;
  }

  return workspaces;
}

export function isWorkspaceOpen(): boolean {
  return !!(workspace.workspaceFolders && workspace.workspaceFolders[0].uri.fsPath);
}

export function getPathByPlatform(workspace: Uri): string {
  return process.platform === "win32" ? `${workspace.scheme}:${workspace.path}` : workspace.fsPath;
}

async function getWorkspaceFiles(dirPath: string): Promise<TruffleWorkspace[]> {
  const files = glob.sync(`${dirPath}/**/${Constants.defaultTruffleConfigFileName}`, {
    ignore: Constants.workspaceIgnoredFolders,
  });

  const truffleWorkSpaces: TruffleWorkspace[] = files.map((file) => {
    return {
      dirName: path.dirname(file).split(path.sep).pop()!.toString(),
      workspace: Uri.parse(path.dirname(file)),
      truffleConfig: Uri.parse(file),
    };
  });

  return truffleWorkSpaces;
}
