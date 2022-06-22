// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {window} from "vscode";
import {Constants} from "../Constants";
import {required} from "../helpers/required";
import {DashboardService} from "../services";
import {Telemetry} from "../TelemetryClient";
import {ProjectView} from "../ViewItems";

export namespace DashboardCommands {
  // Command to bind to UI commands
  export async function startDashboardCmd(projectView?: ProjectView): Promise<void> {
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

    console.log(projectView);
    // const port = await getGanachePort(projectView);
    // const options = await getGanacheProjectOptions(projectView);

    const dashboardProcess = await DashboardService.startDashboardServer(Constants.dashboardPort);

    if (!dashboardProcess.process) {
      Telemetry.sendEvent("DashboardCommands.startDashboardCmd.serverAlreadyRunning");
      window.showInformationMessage(Constants.dashboardCommandStrings.serverAlreadyRunning);
      return;
    }

    Telemetry.sendEvent("DashboardCommands.startDashboardCmd.commandFinished");
    window.showInformationMessage(Constants.dashboardCommandStrings.serverSuccessfullyStarted);
  }
}
