// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Uri, workspace} from "vscode";
import {Constants} from "../Constants";
import {Telemetry} from "../TelemetryClient";
import * as fs from "fs";
import * as path from "path";

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

  if (workspaces === undefined) {
    const error = new Error(Constants.errorMessageStrings.VariableShouldBeDefined("Workspace root"));
    Telemetry.sendException(error);
    throw error;
  }

  return workspaces;
}

export function isWorkspaceOpen(): boolean {
  return !!(workspace.workspaceFolders && workspace.workspaceFolders[0].uri.fsPath);
}

async function getWorkspaceFiles(dirPath: string, truffleWorkSpaces?: TruffleWorkspace[]): Promise<TruffleWorkspace[]> {
  const files = fs.readdirSync(dirPath);

  truffleWorkSpaces = truffleWorkSpaces || [];

  await Promise.all(
    files.map(async (file) => {
      if (file.includes("node_modules")) return;

      if (fs.statSync(`${dirPath}/${file}`).isDirectory()) {
        truffleWorkSpaces = await getWorkspaceFiles(`${dirPath}/${file}`, truffleWorkSpaces);
      } else {
        if (file === Constants.defaultTruffleConfigFileName)
          truffleWorkSpaces!.push({
            dirName: path.dirname(`${dirPath}/${file}`).split(path.sep).pop()!.toString(),
            workspace: Uri.parse(dirPath),
            truffleConfig: Uri.parse(`${dirPath}/${file}`),
          });
      }
    })
  );

  return truffleWorkSpaces;
}
