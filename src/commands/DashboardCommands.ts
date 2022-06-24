// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {commands, window} from "vscode";
import {Constants, RequiredApps} from "../Constants";
import {required} from "../helpers/required";
import {showIgnorableNotification} from "../helpers/userInteraction";
import {ItemType} from "../Models/ItemType";
import {DashboardNetworkNode, DashboardProject} from "../Models/TreeItems";
import {DashboardService, TreeManager} from "../services";
import {Telemetry} from "../TelemetryClient";
export namespace DashboardCommands {
  // Command to bind to UI commands
  export async function startDashboardCmd(): Promise<void> {
    await showIgnorableNotification(Constants.dashboardCommandStrings.connectingDashboardServer, async () => {
      Telemetry.sendEvent("DashboardCommands.startDashboardCmd.commandStarted");

      if (!(await required.checkDashboardVersion())) {
        Telemetry.sendEvent("DashboardCommands.startDashboardCmd.dashboardVersionError");

        const message = Constants.errorMessageStrings.DashboardVersionError;
        const buttonUpdate = Constants.placeholders.buttonTruffleUpdate;
        const buttonClose = Constants.placeholders.buttonClose;

        const item = await window.showErrorMessage(message, buttonUpdate, buttonClose);

        if (item == buttonUpdate) await required.installTruffle();

        return;
      }

      const project = RequiredApps.dashboard;
      const port = Constants.dashboardPort;

      await DashboardService.startDashboardServer(port);

      await addTreeItemService(project, port);

      Telemetry.sendEvent("DashboardCommands.startDashboardCmd.commandFinished");
    });
  }

  export async function stopDashboardCmd(): Promise<void> {
    Telemetry.sendEvent("DashboardCommands.stopDashboardCmd.commandStarted");

    const port = Constants.dashboardPort;
    const portStatus = await DashboardService.getPortStatus(port);

    if (portStatus === DashboardService.PortStatus.RUNNING) {
      await DashboardService.stopDashboardServer(port);
      Telemetry.sendEvent("DashboardCommands.stopDashboardCmd.isDashboardServer");
      window.showInformationMessage(Constants.dashboardCommandStrings.serverSuccessfullyStopped);
    } else if (portStatus === DashboardService.PortStatus.FREE) {
      Telemetry.sendEvent("DashboardCommands.stopDashboardCmd.portIsFree");
      window.showInformationMessage(Constants.dashboardCommandStrings.serverSuccessfullyStopped);
    } else {
      Telemetry.sendEvent("DashboardCommands.stopDashboardCmd.noDashboardServer");
      window.showWarningMessage(Constants.dashboardCommandStrings.serverCanNotStop);
    }

    Telemetry.sendEvent("DashboardCommands.stopDashboardCmd.commandFinished");
  }

  async function addTreeItemService(projectName: string, port: number): Promise<void> {
    const service = TreeManager.getItem(ItemType.DASHBOARD_SERVICE);
    const projects = service.getChildren() as DashboardProject[];

    if (projects.length > 0) return;

    const description = `${Constants.networkProtocols.http}${Constants.localhost}:${port}`;
    const url = `${Constants.networkProtocols.http}${Constants.localhost}:${port}/rpc`;
    const networkNode = new DashboardNetworkNode(projectName, url, "*");
    const project = new DashboardProject(projectName, port, description);

    project.addChild(networkNode);
    service.addChild(project);

    TreeManager.saveState();
    commands.executeCommand("truffle-vscode.refresh");

    Telemetry.sendEvent("ServiceCommands.execute.newServiceItem", {
      ruri: Telemetry.obfuscate((project.resourceUri || "").toString()),
      type: Telemetry.obfuscate(project.itemType.toString()),
      url: Telemetry.obfuscate(JSON.stringify(await project.getRPCAddress())),
    });
  }
}
