// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Constants, RequiredApps} from '@/Constants';
import {required} from '@/helpers/required';
import {checkTruffleConfigNaming} from '@/helpers/TruffleConfiguration';
import {showIgnorableNotification, showInputBox, showOpenFolderDialog, showQuickPick} from '@/helpers/userInteraction';
import {CancellationEvent} from '@/Models';
import {Telemetry} from '@/TelemetryClient';
import fs from 'fs-extra';
import {Uri, window, workspace} from 'vscode';
import {gitHelper, outputCommandHelper} from '../helpers';

/**
 * Represents the project type for creating a new project.
 */
enum ProjectType {
  empty = 'empty',
  sample = 'sample',
  box = 'box',
}

/**
 * Represents the command for creating the new project (destinations).
 */
interface IProjectDestination {
  cmd: (projectPath: string, projectType: ProjectType) => Promise<void>;
  label: string;
  detail?: string;
  projectType: ProjectType;
}

export namespace ProjectCommands {
  /**
   * This role is a public role responsible for allowing the user to start
   * creating the project.
   */
  export async function newSolidityProject(): Promise<void> {
    Telemetry.sendEvent('ProjectCommands.newSolidityProject.started');

    // Checks if required applications are installed
    if (!(await required.checkRequiredApps())) {
      return;
    }

    // Chooses the directory path where the new project will be created
    const projectPath = await chooseNewProjectDir();

    // Sets the QuickPick items
    const typeOfSolidityProjectDestination: IProjectDestination[] = [
      {
        cmd: createProject,
        label: Constants.typeOfSolidityProject.text.emptyProject,
        detail: Constants.typeOfSolidityProject.description.emptyProject,
        projectType: ProjectType.empty,
      },
      {
        cmd: createProject,
        label: Constants.typeOfSolidityProject.text.sampleProject,
        detail: Constants.typeOfSolidityProject.description.sampleProject,
        projectType: ProjectType.sample,
      },
      {
        cmd: createProject,
        label: Constants.typeOfSolidityProject.text.projectFromTruffleBox,
        detail: Constants.typeOfSolidityProject.description.projectFromTruffleBox,
        projectType: ProjectType.box,
      },
    ];

    // Displays the QuickPick with the possibilities to choose between project types
    const command = (await showQuickPick(typeOfSolidityProjectDestination, {
      placeHolder: Constants.placeholders.selectTypeOfSolidityProject,
      ignoreFocusOut: true,
    })) as IProjectDestination;

    // Creates the project
    await command.cmd(projectPath, command.projectType);

    // Starts the git
    await gitHelper.gitInit(projectPath);

    Telemetry.sendEvent('ProjectCommands.newSolidityProject.finished');
  }
}

/**
 * This function is responsible for allowing the user to choose in which directory
 * the new project will be created.
 *
 * @returns the project path
 */
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

/**
 * This function is responsible for creating the project according to the chosen project type.
 *
 * @param projectPath the directory path where the project will be created
 * @param projectType the type of project the user wants to create: empty, default, or unbox a truffle project
 */
async function createProject(projectPath: string, projectType: ProjectType): Promise<void> {
  await showIgnorableNotification(Constants.statusBarMessages.creatingProject, async () => {
    try {
      Telemetry.sendEvent(`ProjectCommands.createProject.${projectType}.started`);

      // Checks the project type
      switch (projectType) {
        case ProjectType.empty:
          // Starts a empty project
          await outputCommandHelper.executeCommand(projectPath, 'npx', RequiredApps.truffle, 'init');
          break;
        case ProjectType.sample:
          // Starts a default project
          await outputCommandHelper.executeCommand(
            projectPath,
            'npx',
            RequiredApps.truffle,
            'unbox',
            Constants.defaultTruffleBox
          );
          break;
        case ProjectType.box: {
          // Gets the name of truffle box
          const truffleBoxName = await getTruffleBoxName();
          // Unboxs the truffle project
          await outputCommandHelper.executeCommand(projectPath, 'npx', RequiredApps.truffle, 'unbox', truffleBoxName);
          break;
        }
      }

      // Looking for truffle config named in old style and rename it to truffle-config.js
      checkTruffleConfigNaming(projectPath);

      // Updates the workspace folders with the new workspace
      workspace.updateWorkspaceFolders(0, workspace.workspaceFolders ? workspace.workspaceFolders.length : null, {
        uri: Uri.file(projectPath),
      });

      Telemetry.sendEvent(`ProjectCommands.createProject.${projectType}.finished`);
    } catch (error) {
      fs.emptyDirSync(projectPath);
      Telemetry.sendException(new Error(Constants.errorMessageStrings.NewProjectCreationFailed));
      throw new Error(`${Constants.errorMessageStrings.NewProjectCreationFailed} ${(error as Error).message}`);
    }
  });
}

/**
 * This function is responsible for allowing the user to type the name of a
 * truffle box so that the unbox is performed.
 *
 * @returns the truffle box name
 */
async function getTruffleBoxName(): Promise<string> {
  return await showInputBox({
    ignoreFocusOut: true,
    prompt: Constants.paletteLabels.enterTruffleBoxName,
    validateInput: (value: string) => {
      if (value.indexOf('://') !== -1 || value.indexOf('git@') !== -1 || value.split('/').length === 2) {
        return Constants.validationMessages.forbiddenSymbols;
      }

      return;
    },
  });
}
