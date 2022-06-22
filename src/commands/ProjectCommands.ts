// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import fs from "fs-extra";
import {Uri, window, workspace} from "vscode";
import {Constants, RequiredApps} from "../Constants";
import {gitHelper, outputCommandHelper, TruffleConfiguration} from "../helpers";
import {required} from "../helpers/required";
import {showIgnorableNotification, showInputBox, showOpenFolderDialog, showQuickPick} from "../helpers/userInteraction";
import {CancellationEvent} from "../Models";
import {Telemetry} from "../TelemetryClient";

interface IProjectDestination {
  cmd: (projectPath: string) => Promise<void>;
  label: string;
}

export namespace ProjectCommands {
  export async function newSolidityProject(): Promise<void> {
    Telemetry.sendEvent("ProjectCommands.newSolidityProject.started");
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

    Telemetry.sendEvent("ProjectCommands.newSolidityProject.initialization");
    await command.cmd(projectPath);
    await gitHelper.gitInit(projectPath);
  }
}

async function chooseNewProjectDir(): Promise<string> {
  const projectPath = await showOpenFolderDialog();

  await fs.ensureDir(projectPath);
  const arrayFiles = await fs.readdir(projectPath);

  if (arrayFiles.length) {
    Telemetry.sendEvent("ProjectCommands.chooseNewProjectDir.directoryNotEmpty");
    const answer = await window.showErrorMessage(
      Constants.errorMessageStrings.DirectoryIsNotEmpty,
      Constants.informationMessage.openButton,
      Constants.informationMessage.cancelButton
    );

    if (answer === Constants.informationMessage.openButton) {
      return chooseNewProjectDir();
    } else {
      Telemetry.sendEvent("ProjectCommands.chooseNewProjectDir.userCancellation");
      throw new CancellationEvent();
    }
  }

  return projectPath;
}

async function createNewEmptyProject(projectPath: string): Promise<void> {
  Telemetry.sendEvent("ProjectCommands.createNewEmptyProject.started");

  await createProject(projectPath, Constants.defaultTruffleBox);

  Telemetry.sendEvent("ProjectCommands.createNewEmptyProject.finished");
}

async function createProjectFromTruffleBox(projectPath: string): Promise<void> {
  const truffleBoxName = await getTruffleBoxName();

  Telemetry.sendEvent("ProjectCommands.createProjectFromTruffleBox.started", {truffleBoxName});

  await createProject(projectPath, truffleBoxName);

  Telemetry.sendEvent("ProjectCommands.createProjectFromTruffleBox.finished", {truffleBoxName});
}

async function createProject(projectPath: string, truffleBoxName: string): Promise<void> {
  await showIgnorableNotification(Constants.statusBarMessages.creatingProject, async () => {
    try {
      Telemetry.sendEvent("ProjectCommands.createProject.unbox", {truffleBoxName});
      await outputCommandHelper.executeCommand(projectPath, "npx", RequiredApps.truffle, "unbox", truffleBoxName);

      TruffleConfiguration.checkTruffleConfigNaming(projectPath);
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

async function getTruffleBoxName(): Promise<string> {
  return await showInputBox({
    ignoreFocusOut: true,
    prompt: Constants.paletteLabels.enterTruffleBoxName,
    validateInput: (value: string) => {
      if (value.indexOf("://") !== -1 || value.indexOf("git@") !== -1 || value.split("/").length === 2) {
        return Constants.validationMessages.forbiddenSymbols;
      }

      return;
    },
  });
}
