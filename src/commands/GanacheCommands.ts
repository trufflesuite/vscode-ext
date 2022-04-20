// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {QuickPickItem, window} from "vscode";
import {Constants} from "../Constants";
import {showQuickPick} from "../helpers";
import {ItemType} from "../Models";
import {LocalProject} from "../Models/TreeItems";
import {GanacheService, TreeManager} from "../services";
import {Telemetry} from "../TelemetryClient";
import {ProjectView} from "../ViewItems";

export namespace GanacheCommands {
  // Command to bind to UI commands
  export async function startGanacheCmd(projectView?: ProjectView): Promise<void> {
    Telemetry.sendEvent("GanacheCommands.startGanacheCmd.commandStarted");

    const port = await getGanachePort(projectView);
    const ganacheProcess = await GanacheService.startGanacheServer(port);

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
}
