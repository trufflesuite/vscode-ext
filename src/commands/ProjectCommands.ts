// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as fs from 'fs-extra';
import { ProgressLocation, Uri, window, workspace } from 'vscode';
import { Constants } from '../Constants';
import {
  gitHelper,
  outputCommandHelper,
  required,
  showInputBox,
  showOpenFolderDialog,
  showQuickPick,
} from '../helpers';
import { CancellationEvent } from '../Models';
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

    const projectPath = await chooseNewProjectDir();

    await command.cmd(projectPath);
    await gitHelper.gitInit(projectPath);
  }
}

async function chooseNewProjectDir(): Promise<string> {
  const projectPath = await showOpenFolderDialog();

  await fs.ensureDir(projectPath);
  const arrayFiles =  await fs.readdir(projectPath);

  if (arrayFiles.length) {
    const answer = await window
      .showErrorMessage(
        Constants.errorMessageStrings.DirectoryIsNotEmpty,
        Constants.informationMessage.openButton,
        Constants.informationMessage.cancelButton);

    if (answer === Constants.informationMessage.openButton) {
      return chooseNewProjectDir();
    } else {
      throw new CancellationEvent();
    }
  }

  return projectPath;
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
  try {
    Output.show();
    await outputCommandHelper.executeCommand(projectPath, 'npx', Constants.truffleCommand, 'unbox', truffleBoxName);
    workspace.updateWorkspaceFolders(
      0,
      workspace.workspaceFolders ? workspace.workspaceFolders.length : null,
      {uri: Uri.file(projectPath)});
  } catch (error) {
    fs.emptyDirSync(projectPath);
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
