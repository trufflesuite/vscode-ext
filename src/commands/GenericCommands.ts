// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {commands, window} from "vscode";
import {Constants, RequiredApps} from "../Constants";
import {required} from "../helpers";
import {GenericProject} from "../Models/TreeItems";
import {GenericService, TreeManager} from "../services";
import {Telemetry} from "../TelemetryClient";
import {ProjectView} from "../ViewItems";

export namespace GenericCommands {
  // Command to bind to UI commands
  export async function checkForConnection(projectView?: ProjectView): Promise<void> {
    Telemetry.sendEvent("GenericCommands.checkForConnection.commandStarted");

    if (!(await required.checkApps(RequiredApps.node))) {
      Telemetry.sendEvent("GenericCommands.checkForConnection.nodeIsNotInstalled");
      commands.executeCommand("truffle-vscode.showRequirementsPage");
      return;
    }

    const project: GenericProject = projectView?.extensionItem as GenericProject;
    const clientVersion: string = await GenericService.getClientVersion(project.port);

    if (clientVersion.length === 0) {
      project.description = Constants.genericCommandStrings.serverNotFound;
      window.showErrorMessage(Constants.genericCommandStrings.serverNoAvailable);
    } else {
      project.description = clientVersion;
      window.showInformationMessage(Constants.genericCommandStrings.serverRunning);
    }

    TreeManager.saveState();
    await commands.executeCommand("truffle-vscode.refresh");

    Telemetry.sendEvent("GenericCommands.checkForConnection.commandFinished");
  }
}
