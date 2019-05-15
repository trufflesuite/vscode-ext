// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as fs from 'fs-extra';
import { ProgressLocation, Uri, window, workspace } from 'vscode';
import { Constants } from '../Constants';
import {
  createTemporaryDir,
  gitHelper,
  outputCommandHelper,
  required,
  showInputBox,
  showOpenFolderDialog,
  showQuickPick,
} from '../helpers';
import { Output } from '../Output';

interface IProjectDestination {
  cmd: (projectPath: string) => Promise<void>;
  label: string;
}

export namespace ProjectCommands {
  export async function newSolidityProject(): Promise<void> {
    if (!await required.checkRequiredApps()) {
      return;
    }

    const typeOfSolidityProjectDestination: IProjectDestination[] = [
      {
        cmd: createNewEmptyProject,
        label: Constants.typeOfSolidityProject.text.emptyProject,
      },
      {
        cmd: createProjectFromTruffleBox,
        label: Constants.typeOfSolidityProject.text.projectFromTruffleBox,
      },
    ];

    const command = await showQuickPick(
      typeOfSolidityProjectDestination,
      { placeHolder: Constants.placeholders.selectTypeOfSolidityProject, ignoreFocusOut: true },
    );

    const projectPath = await showOpenFolderDialog();

    await command.cmd(projectPath);
    await gitHelper.gitInit(projectPath);
  }
}

async function createNewEmptyProject(projectPath: string): Promise<void> {
  return window.withProgress({
    location: ProgressLocation.Window,
    title: Constants.statusBarMessages.creatingProject,
  }, async () => {
    return createProject(projectPath, Constants.defaultTruffleBox);
  });
}

async function createProjectFromTruffleBox(projectPath: string): Promise<void> {
  const truffleBoxName = await getTruffleBoxName();
  await createProject(projectPath, truffleBoxName);
}

async function createProject(projectPath: string, truffleBoxName: string): Promise<void> {
  await fs.ensureDir(projectPath);

  const arrayFiles =  await fs.readdir(projectPath);
  const path = (arrayFiles.length) ? createTemporaryDir(projectPath) : projectPath;

  try {
    Output.show();
    await outputCommandHelper.executeCommand(path, 'npx', Constants.truffleCommand, 'unbox', truffleBoxName);
    if (arrayFiles.length) {
      fs.moveSync(path, projectPath);
    }
    workspace.updateWorkspaceFolders(
      0,
      workspace.workspaceFolders ? workspace.workspaceFolders.length : null,
      {uri: Uri.file(projectPath)});
  } catch (error) {
    arrayFiles.length ? fs.removeSync(path) : fs.emptyDirSync(path);
    throw Error([Constants.errorMessageStrings.NewProjectCreationFailed, error.message].join(' '));
  }
}

async function getTruffleBoxName(): Promise<string> {
  return await showInputBox({
    ignoreFocusOut: true,
    prompt: Constants.paletteWestlakeLabels.enterTruffleBoxName,
    validateInput: (value: string) => {
      if (value.indexOf('://') !== -1 || value.indexOf('git@') !== -1 || value.split('/').length === 2) {
        return Constants.validationMessages.unallowedSymbols;
      }

      return;
    },
  });
}
