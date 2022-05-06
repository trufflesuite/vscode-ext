// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {commands, QuickPickItem, window} from "vscode";
import {Constants, RequiredApps} from "../Constants";
import {required, showQuickPick} from "../helpers";
import {ItemType} from "../Models";
import {LocalProject, TLocalProjectOptions} from "../Models/TreeItems";
import {GanacheService, TreeManager} from "../services";
import {Telemetry} from "../TelemetryClient";
import {ProjectView} from "../ViewItems";

export namespace GanacheCommands {
  // Command to bind to UI commands
  export async function startGanacheCmd(projectView?: ProjectView): Promise<void> {
    Telemetry.sendEvent("GanacheCommands.startGanacheCmd.commandStarted");

    if (!(await required.checkApps(RequiredApps.node))) {
      Telemetry.sendEvent("GanacheCommands.startGanacheCmd.nodeIsNotInstalled");
      commands.executeCommand("truffle-vscode.showRequirementsPage");
      return;
    }

    const port = await getGanachePort(projectView);
    const options = await getGanacheProjectOptions(projectView);

    const ganacheProcess = await GanacheService.startGanacheServer(port, options);

    if (!ganacheProcess.process) {
      Telemetry.sendEvent("GanacheCommands.startGanacheCmd.serverAlreadyRunning");
      window.showInformationMessage(Constants.ganacheCommandStrings.serverAlreadyRunning);
      return;
    }

    Telemetry.sendEvent("GanacheCommands.startGanacheCmd.commandFinished");
    window.showInformationMessage(Constants.ganacheCommandStrings.serverSuccessfullyStarted);
  }

  // Command to bind to UI commands
  export async function stopGanacheCmd(projectView?: ProjectView): Promise<void> {
    Telemetry.sendEvent("GanacheCommands.stopGanacheCmd.commandStarted");
    const port = await getGanachePort(projectView);
    const portStatus = await GanacheService.getPortStatus(port);

    if (portStatus === GanacheService.PortStatus.GANACHE) {
      await GanacheService.stopGanacheServer(port);
      Telemetry.sendEvent("GanacheCommands.stopGanacheCmd.isGanacheServer");
      window.showInformationMessage(Constants.ganacheCommandStrings.serverSuccessfullyStopped);
    } else if (portStatus === GanacheService.PortStatus.FREE) {
      Telemetry.sendEvent("GanacheCommands.stopGanacheCmd.portIsFree");
      window.showInformationMessage(Constants.ganacheCommandStrings.serverSuccessfullyStopped);
    } else {
      Telemetry.sendEvent("GanacheCommands.stopGanacheCmd.noGanacheServer");
      window.showWarningMessage(Constants.ganacheCommandStrings.serverCanNotStop);
    }

    Telemetry.sendEvent("GanacheCommands.stopGanacheCmd.commandFinished");
  }

  export async function getGanachePort(projectView?: ProjectView): Promise<number | string> {
    if (projectView && projectView.extensionItem instanceof LocalProject) {
      return projectView.extensionItem.port;
    }

    const hosts = TreeManager.getItem(ItemType.LOCAL_SERVICE);

    if (!hosts || !hosts.getChildren()) {
      const error = new Error(Constants.ganacheCommandStrings.serverNoGanacheAvailable);
      Telemetry.sendException(error);
      throw error;
    }

    const options = hosts.getChildren();
    const pick = await showQuickPick(options as QuickPickItem[], {
      placeHolder: Constants.placeholders.selectGanacheServer,
      ignoreFocusOut: true,
    });
    return (pick as LocalProject).port;
  }

  export async function getGanacheProjectOptions(projectView?: ProjectView): Promise<TLocalProjectOptions> {
    const project: LocalProject = projectView?.extensionItem as LocalProject;
    return project.options!;
  }
}
