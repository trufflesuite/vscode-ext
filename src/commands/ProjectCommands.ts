// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Constants, RequiredApps} from '@/Constants';
import {required} from '@/helpers/required';
import {checkTruffleConfigNaming} from '@/helpers/TruffleConfiguration';
import {showIgnorableNotification, showOpenFolderDialog, showQuickPick} from '@/helpers/userInteraction';
import {CancellationEvent} from '@/Models';
import {Telemetry} from '@/TelemetryClient';
import fs from 'fs-extra';
import requestPromise from 'request-promise';
import {QuickPickItem, Uri, window, workspace} from 'vscode';
import {gitHelper, outputCommandHelper} from '../helpers';

type TBox = {
  label: string;
  detail: string;
  unbox: string;
};

interface IProjectDestination {
  cmd: (projectPath: string) => Promise<void>;
  label: string;
}

export namespace ProjectCommands {
  export async function newSolidityProject(): Promise<void> {
    Telemetry.sendEvent('ProjectCommands.newSolidityProject.started');
    if (!(await required.checkRequiredApps())) {
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

    const command = await showQuickPick(typeOfSolidityProjectDestination, {
      placeHolder: Constants.placeholders.selectTypeOfSolidityProject,
      ignoreFocusOut: true,
    });

    const projectPath = await chooseNewProjectDir();

    Telemetry.sendEvent('ProjectCommands.newSolidityProject.initialization');
    await command.cmd(projectPath);
    await gitHelper.gitInit(projectPath);
  }
}

async function chooseNewProjectDir(): Promise<string> {
  const projectPath = await showOpenFolderDialog();

  await fs.ensureDir(projectPath);
  const arrayFiles = await fs.readdir(projectPath);

  if (arrayFiles.length) {
    Telemetry.sendEvent('ProjectCommands.chooseNewProjectDir.directoryNotEmpty');
    const answer = await window.showErrorMessage(
      Constants.errorMessageStrings.DirectoryIsNotEmpty,
      Constants.informationMessage.openButton,
      Constants.informationMessage.cancelButton
    );

    if (answer === Constants.informationMessage.openButton) {
      return chooseNewProjectDir();
    } else {
      Telemetry.sendEvent('ProjectCommands.chooseNewProjectDir.userCancellation');
      throw new CancellationEvent();
    }
  }

  return projectPath;
}

async function createNewEmptyProject(projectPath: string): Promise<void> {
  Telemetry.sendEvent('ProjectCommands.createNewEmptyProject.started');

  await createProject(projectPath, Constants.defaultTruffleBox);

  Telemetry.sendEvent('ProjectCommands.createNewEmptyProject.finished');
}

async function createProjectFromTruffleBox(projectPath: string): Promise<void> {
  const truffleUnboxCommand = await getTruffleUnboxCommand();

  Telemetry.sendEvent('ProjectCommands.createProjectFromTruffleBox.started', {truffleUnboxCommand});

  await createProject(projectPath, truffleUnboxCommand);

  Telemetry.sendEvent('ProjectCommands.createProjectFromTruffleBox.finished', {truffleUnboxCommand});
}

async function createProject(projectPath: string, truffleUnboxCommand: string): Promise<void> {
  await showIgnorableNotification(Constants.statusBarMessages.creatingProject, async () => {
    try {
      Telemetry.sendEvent('ProjectCommands.createProject.unbox', {truffleUnboxCommand});
      await outputCommandHelper.executeCommand(projectPath, 'npx', RequiredApps.truffle, 'unbox', truffleUnboxCommand);

      checkTruffleConfigNaming(projectPath);
      workspace.updateWorkspaceFolders(0, workspace.workspaceFolders ? workspace.workspaceFolders.length : null, {
        uri: Uri.file(projectPath),
      });
    } catch (error) {
      fs.emptyDirSync(projectPath);
      Telemetry.sendException(new Error(Constants.errorMessageStrings.NewProjectCreationFailed));
      throw new Error(`${Constants.errorMessageStrings.NewProjectCreationFailed} ${(error as Error).message}`);
    }
  });
}

/**
 * Gets the boxes list and show the options to the user
 * @returns the unbox command of the box selected by the user
 */
async function getTruffleUnboxCommand(): Promise<string> {
  const boxes = await getBoxes();

  const pick = (await showQuickPick(boxes as QuickPickItem[], {
    placeHolder: Constants.paletteLabels.enterTruffleBoxName,
    ignoreFocusOut: true,
  })) as TBox;

  return pick.unbox;
}

/**
 * Gets the json file containing all the boxes from trufflesuite.com
 * @returns a list of boxes based on the TBox type
 */
async function getBoxes(): Promise<TBox[]> {
  try {
    const response = await requestPromise.get(Constants.truffleBoxes);
    const result = JSON.parse(response);

    return Object.values(result).map((box: any) => {
      return {
        label: box.displayName,
        detail: box.description,
        unbox: box.official ? box.repoName : `${box.userOrg}/${box.repoName}`,
      } as TBox;
    });
  } catch (error) {
    throw new Error(Constants.errorMessageStrings.FetchingBoxesHasFailed);
  }
}
