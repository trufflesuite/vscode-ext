// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Uri, workspace} from 'vscode';
import {Constants} from '@/Constants';
import {Telemetry} from '@/TelemetryClient';
import * as path from 'path';
import glob from 'glob';
import {showQuickPick} from '@/helpers/userInteraction';
// import {Entry} from '@/views/FileExplorer';

/**
 * A Truffle workspace is defined by the presence of a Truffle config file.
 * It represents the `--config` option of Truffle CLI:
 *
 * ```txt
 * --config <file>
 *   Specify configuration file to be used. The default is truffle-config.js
 * ```
 *
 * For more information,
 * see https://trufflesuite.com/docs/truffle/reference/configuration/.
 */
export class TruffleWorkspace {
  constructor(truffleConfigPath: string) {
    this.truffleConfigName = path.basename(truffleConfigPath);
    this.dirName = path.dirname(truffleConfigPath).split(path.sep).pop()!.toString();
    this.workspace = Uri.parse(path.dirname(truffleConfigPath));
    this.truffleConfig = Uri.parse(truffleConfigPath);
  }

  /**
   * Represents the `basename`, _i.e._, the file name portion,
   * of the Truffle Config path of this workspace.
   * In most cases, this is `truffle-config.js`.
   */
  truffleConfigName: string;

  /**
   * The last directory name where this Truffle config file is located.
   */
  dirName: string;

  /**
   * The `Uri` path where this Truffle config file is located.
   */
  workspace: Uri;

  /**
   * The full `Uri` path where this Truffle config file is located.
   */
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

/**
 * Gets or selects the Truffle config file to be used in subsequent commands.
 * Many commands can be invoked either from the _Command Palette_,
 * contextual menus, or programatically.
 * If the `contractUri` was provided, _e.g._,
 * invoked from contextual menu or programatically, returns the root directory.
 * Otherwise, If the URI wasn't provided, retrieves all truffle projects
 *
 * If more than one Truffle config files are found,
 * it displays a quick pick to allow the user to select the appropiate one.
 *
 * @param contractUri when present, only look for Truffle config file in the workspace where it belongs.
 * @returns the `TruffleWorkspace` representing the selected Truffle config file.
 */
export async function getTruffleWorkspace(contractUri?: Uri): Promise<TruffleWorkspace> {
  const workspaces = await (contractUri
    ? getTruffleWorkspaces(workspace.getWorkspaceFolder(contractUri)!.uri.fsPath)
    : getWorkspacesFolders());

  if (workspaces.length === 1) {
    // If there is only one truffle project, return the root directory
    return workspaces[0];
  } else {
    // If there is more than one truffle project, a QuickPick is opened with them
    return await getTruffleConfigFromQuickPick(workspaces);
  }
}

export function isWorkspaceOpen(): boolean {
  return !!(workspace.workspaceFolders && workspace.workspaceFolders[0].uri.fsPath);
}

export function getPathByPlatform(workspace: Uri): string {
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

/**
 * Searches for Truffle config files in `workspaceRootPath` recursively.
 *
 * @param workspaceRootPath the root path where to look for Truffle config files.
 * @returns all Truffle config files found wrapped in `TruffleWorkspace`.
 */
async function getTruffleWorkspaces(workspaceRootPath: string): Promise<TruffleWorkspace[]> {
  const files = glob.sync(`${workspaceRootPath}/**/truffle-config{,.*}.js`, {
    ignore: Constants.workspaceIgnoredFolders,
  });

  return files.map((file) => new TruffleWorkspace(file));
}

/**
 * Shows the list of `workspaces` in a quick pick so the user can select
 * the Truffle config file.
 *
 * @param workspaces
 * @returns the Truffle config file URI of the selected Truffle workspace.
 */
async function getTruffleConfigFromQuickPick(workspaces: TruffleWorkspace[]): Promise<TruffleWorkspace> {
  const folders = Array.from(workspaces).map((element) => {
    return {
      label: element.dirName,
      description: element.truffleConfigName,
      detail: process.platform === 'win32' ? element.dirName : element.workspace.fsPath,
      truffleWorkspace: element,
    };
  });

  const result = await showQuickPick(folders, {
    ignoreFocusOut: true,
    placeHolder: Constants.placeholders.selectContract,
  });

  return result.truffleWorkspace;
}
