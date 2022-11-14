// Copyright (c) 2022. Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {TruffleCommands} from '@/commands';
import {Constants} from '@/Constants';
import {getWorkspaceForUri} from '@/helpers/AbstractWorkspace';
import {Telemetry} from '@/TelemetryClient';
import * as path from 'path';
import {Memento, TextDocument, Uri, workspace, WorkspaceFolder} from 'vscode';

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
 * Method to map filepaths properly on windows machines.
 * @param workspace
 */
export const getPathByPlatform = (workspace: Uri): string =>
  process.platform === 'win32' ? `${workspace.scheme}:${workspace.path}` : workspace.fsPath;

/**
 * Every time the `workspace.onDidSaveTextDocument` listener emits a notification,
 * this function receives, identifies the file extension and calls the corresponding function.
 *
 * @param globalState A memento object that stores state independent of the current opened workspace.
 * @param document Represents a text document, such as a source file.
 */
export async function saveTextDocument(globalState: Memento, document: TextDocument): Promise<void> {
  switch (path.extname(document.fileName)) {
    case '.sol': {
      // Gets the current state of the status bar item
      const isAutoDeployOnSaveEnabled = globalState.get<boolean>(Constants.globalStateKeys.contractAutoDeployOnSave);

      // If enabled, calls the function that performs the deployment
      if (isAutoDeployOnSaveEnabled) {
        await TruffleCommands.deployContracts(await getWorkspaceForUri(Uri.parse(document.fileName)));
      }
      break;
    }
    default:
      break;
  }
}

/**
 * Gets the first Workspace folder or undefined.
 */
export const getWorkspaceFolder = (): WorkspaceFolder | undefined =>
  workspace.workspaceFolders?.filter((folder) => folder.uri.scheme === 'file')[0];
