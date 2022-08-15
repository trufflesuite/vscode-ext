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
const TRUFFLE_CONFIG_GLOB = 'truffle-config{,.*}.js';
const HARDHAT_CONFIG_GLOB = 'hardhat.config{,.*}.ts';

/**
 * A Truffle workspace is defined by the presence of a Truffle config file.
 * It represents the `--config` option of the Truffle CLI:
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
  /**
   * Creates a `TruffleWorkspace`.
   *
   * @param truffleConfigPath the full path of the Truffle config file.
   */
  constructor(truffleConfigPath: string) {
    this.truffleConfigName = path.basename(truffleConfigPath);
    this.dirName = path.dirname(truffleConfigPath).split(path.sep).pop()!.toString();
    this.workspace = Uri.parse(path.dirname(truffleConfigPath));
    this.truffleConfig = Uri.parse(truffleConfigPath);
  }

  /**
   * Represents the `basename`, _i.e._, the file name portion,
   * of the Truffle config file of this workspace.
   * In most cases, this is `truffle-config.js`.
   */
  truffleConfigName: string;

  /**
   * The last directory name where this Truffle config file is located.
   */
  dirName: string;

  /**
   * The `Uri` path of the directory where this Truffle config file is located.
   */
  workspace: Uri;

  /**
   * The full `Uri` path where this Truffle config file is located.
   */
  truffleConfig: Uri;
}

/**
 * ! We need to remove this because it does not support multiple Truffle config files.
 * @param ignoreException
 * @returns
 */
export function getWorkspaceRoot(ignoreException = false): string | undefined {
  const workspaceRoot =
    workspace.workspaceFolders &&
    (workspace.workspaceFolders.length === 0 ? undefined : workspace.workspaceFolders[0].uri.fsPath);

  if (workspaceRoot === undefined && !ignoreException) {
    const error = new Error(Constants.errorMessageStrings.VariableShouldBeDefined('Workspace root'));
    Telemetry.sendException(error);
    throw error;
  }

  return workspaceRoot;
}

/**
 * Gets or selects the Truffle config file to be used in subsequent operations.
 *
 * Many commands can be invoked either from the _Command Palette_,
 * a context menu, or programatically.
 * If `contractUri` was provided, _e.g._, invoked from a context menu or programatically,
 * it looks for Truffle config files in the Workspace where `contractUri` belongs.
 * Otherwise, if `contractURi` is not present,
 * it looks for Truffle config files in all Workspace folders.
 * It uses {@link findTruffleWorkspaces} to find Truffle config files within a single Workspace folder.
 *
 * If only one Truffle config file is found, it returns that config file.
 * However, if more than one Truffle config files are found,
 * it displays a quick pick to allow the user to select the appropriate one.
 *
 * @param contractUri when present, only look for Truffle config files in the workspace where it belongs.
 * @returns the {@link TruffleWorkspace} representing the selected Truffle config file.
 */
export async function getTruffleWorkspace(contractUri?: Uri): Promise<TruffleWorkspace> {
  const workspaces = await (contractUri
    ? findTruffleWorkspaces(workspace.getWorkspaceFolder(contractUri)!.uri.fsPath)
    : getAllTruffleWorkspaces());
  if (workspaces.length === 0) {
    const error = new Error(Constants.errorMessageStrings.VariableShouldBeDefined('Workspace root'));
    Telemetry.sendException(error);
    throw error;
  }

  if (workspaces.length === 1) {
    return workspaces[0];
  }

  return await selectTruffleConfigFromQuickPick(workspaces);
}

/**
 * Method to map filepaths properly on windows machines.
 * @param workspace
 */
export function getPathByPlatform(workspace: Uri): string {
  return process.platform === 'win32' ? `${workspace.scheme}:${workspace.path}` : workspace.fsPath;
}

/**
 * Finds _all_ Truffle config files within the open folders in the workbench.
 * It uses {@link findTruffleWorkspaces} to find Truffle config files within a single Workspace folder.
 *
 * @returns all Truffle config files found wrapped in {@link TruffleWorkspace}.
 */
export async function getAllTruffleWorkspaces(): Promise<TruffleWorkspace[]> {
  if (workspace.workspaceFolders === undefined) {
    return [];
  }

  const workspaces: TruffleWorkspace[] = [];

  await Promise.all(
    workspace.workspaceFolders.map(async (ws) => {
      workspaces.push(...(await findTruffleWorkspaces(ws.uri.fsPath)));
    })
  );

  return workspaces;
}

/**
 * Searches for Truffle config files in `workspaceRootPath` recursively.
 *
 * Since any `.js` file can be a Truffle config file,
 * we only look for files matching the glob pattern `truffle-config{,.*}.js`.
 * This pattern matches the default `truffle-config.js` name.
 * Truffle config files like `truffle-config.ovm.js` are also matched by this pattern.
 *
 * @param workspaceRootPath the root path where to look for Truffle config files.
 * @returns all Truffle config files found wrapped in `TruffleWorkspace`.
 */
async function findTruffleWorkspaces(workspaceRootPath: string): Promise<TruffleWorkspace[]> {
  const files = glob.sync(`${workspaceRootPath}/**/${TRUFFLE_CONFIG_GLOB}`, {
    ignore: Constants.workspaceIgnoredFolders,
  });

  return files.map((file) => new TruffleWorkspace(file));
}

/**
 * Shows the list of `workspaces` in a quick pick so the user can select
 * the Truffle config file to use.
 *
 * @param workspaces list of workspace folders to display to the user.
 * @returns the Truffle config file of the selected Truffle Workspace.
 */
async function selectTruffleConfigFromQuickPick(workspaces: TruffleWorkspace[]): Promise<TruffleWorkspace> {
  const folders = workspaces.map((element) => {
    return {
      label: element.dirName,
      description: element.truffleConfigName,
      detail: process.platform === 'win32' ? element.dirName : element.workspace.fsPath,
      truffleWorkspace: element,
    };
  });

  const result = await showQuickPick(folders, {
    ignoreFocusOut: true,
    placeHolder: `Select a Truffle config file, filtered by ${TRUFFLE_CONFIG_GLOB}, to use`,
  });

  return result.truffleWorkspace;
}

export namespace AbstractWorkspaceManager {
  class ResolverConfig {
    constructor(public type: WorkspaceType, public glob: string) {}

    async resolvePath(_uri: Uri): Promise<AbstractWorkspace | undefined> {
      return undefined;
    }
  }

  export enum WorkspaceType {
    TRUFFLE = 'Truffle',
    HARDHAT = 'Hardhat',
  }

  export const WorkspaceResolvers: Array<ResolverConfig> = [
    new ResolverConfig(WorkspaceType.TRUFFLE, TRUFFLE_CONFIG_GLOB),
    new ResolverConfig(WorkspaceType.HARDHAT, HARDHAT_CONFIG_GLOB),
  ];

  export class AbstractWorkspace {
    /**
     * Creates a `TruffleWorkspace`.
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
  export function resolveAllWorkspaces(): AbstractWorkspace[] {
    if (workspace.workspaceFolders === undefined) {
      return [];
    }
    return workspace.workspaceFolders.flatMap((ws) => findWorkspaces(ws.uri.fsPath));
  }

  export const findWorkspaces = (workspaceRootPath: string): AbstractWorkspace[] =>
    WorkspaceResolvers.flatMap((r) =>
      glob
        .sync(`${workspaceRootPath}/**/${r.glob}`, {
          ignore: Constants.workspaceIgnoredFolders,
        })
        .map((f) => new AbstractWorkspace(f, r.type))
    );

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

  /**
   * Shows the list of `workspaces` in a quick pick so the user can select
   * the correct config file to use.
   *
   * @param workspaces list of workspace folders to display to the user.
   * @returns the config file of the selected Workspace.
   */
  async function selectConfigFromQuickPick(workspaces: AbstractWorkspace[]): Promise<AbstractWorkspace> {
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
}
