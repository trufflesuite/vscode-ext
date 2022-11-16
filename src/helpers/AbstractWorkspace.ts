// Copyright (c) 2022. Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Constants} from '@/Constants';
import {showQuickPick} from '@/helpers/userInteraction';
import {Telemetry} from '@/TelemetryClient';
import glob from 'glob';
import * as path from 'path';
import {Uri, workspace} from 'vscode';

/**
 * The [glob](https://github.com/isaacs/node-glob#glob-primer) pattern to match Truffle/Other config file names.
 */
export const TRUFFLE_CONFIG_GLOB = 'truffle-config{,.*}.js';
export const HARDHAT_CONFIG_GLOB = 'hardhat.config{,.*}.{js,ts}';

class ResolverConfig {
  constructor(public type: WorkspaceType, public glob: string) {}

  async resolvePath(_uri: Uri): Promise<AbstractWorkspace | undefined> {
    return undefined;
  }
}

export enum WorkspaceType {
  TRUFFLE = 'Truffle',
  HARDHAT = 'Hardhat',
  UNKNOWN = 'Unknown',
}

export const WorkspaceResolvers: Array<ResolverConfig> = [
  new ResolverConfig(WorkspaceType.TRUFFLE, TRUFFLE_CONFIG_GLOB),
  new ResolverConfig(WorkspaceType.HARDHAT, HARDHAT_CONFIG_GLOB),
];

export class AbstractWorkspace {
  /**
   * Creates a `Workspace` of varying Type.
   *
   * @param configPath the full path of the config file.
   * @param workspaceType - the type of config we have found.
   */
  constructor(configPath: string, public readonly workspaceType: WorkspaceType) {
    this.configName = path.basename(configPath);
    this.dirName = path.dirname(configPath).split(path.sep).pop()!.toString();
    this.workspace = Uri.parse(path.dirname(configPath));
    this.configPath = Uri.parse(configPath);
  }

  /**
   * Represents the `basename`, _i.e._, the file name portion
   */
  readonly configName: string;

  /**
   * The last directory name where this config file is located.
   */
  readonly dirName: string;

  /**
   * The `Uri` path of the directory where this config file is located.
   */
  readonly workspace: Uri;

  /**
   * The full `Uri` path where this config file is located.
   */
  readonly configPath: Uri;
}

/**
 * Using all the resolvers, resolve the projects/config files present in the workspaces.
 */
export function resolveAllWorkspaces(includeUnknown = true): AbstractWorkspace[] {
  if (workspace.workspaceFolders === undefined) {
    return [];
  }
  return workspace.workspaceFolders.flatMap((ws) => {
    const foundWs = findWorkspaces(ws.uri.fsPath);
    // patch in the unknown ones.
    if (includeUnknown && foundWs?.length === 0) {
      const configPath = path.join(ws.uri.fsPath, 'UNKNOWN');
      foundWs.push(new AbstractWorkspace(configPath, WorkspaceType.UNKNOWN));
    }
    return foundWs;
  });
}

export const findWorkspaces = (workspaceRootPath: string): AbstractWorkspace[] => {
  return WorkspaceResolvers.flatMap((r) =>
    glob
      .sync(`${workspaceRootPath}/**/${r.glob}`, {
        ignore: Constants.workspaceIgnoredFolders,
      })
      .map((f) => new AbstractWorkspace(f, r.type))
  );
};

/**
 * Shows the list of `workspaces` in a quick pick so the user can select
 * the correct config file to use.
 *
 * @param workspaces list of workspace folders to display to the user.
 * @returns the config file of the selected Workspace.
 */
export async function selectConfigFromQuickPick(workspaces: AbstractWorkspace[]): Promise<AbstractWorkspace> {
  const folders = workspaces.map((element) => {
    return {
      label: element.dirName,
      description: `Type: ${element.workspaceType} : ${element.configName}`,
      detail: process.platform === 'win32' ? element.dirName : element.workspace.fsPath,
      workspace: element,
    };
  });

  const result = await showQuickPick(folders, {
    ignoreFocusOut: true,
    placeHolder: `Select a config file to use`,
  });
  return result.workspace;
}

export async function getWorkspaceForUri(contractUri?: Uri): Promise<AbstractWorkspace> {
  const workspaces = contractUri
    ? findWorkspaces(workspace.getWorkspaceFolder(contractUri)!.uri.fsPath)
    : resolveAllWorkspaces();
  if (workspaces.length === 0) {
    const error = new Error(Constants.errorMessageStrings.VariableShouldBeDefined('Workspace root'));
    Telemetry.sendException(error);
    throw error;
  }

  if (workspaces.length === 1) {
    return workspaces[0];
  }

  return await selectConfigFromQuickPick(workspaces);
}
