// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {window} from 'vscode';
import {Constants} from '@/Constants';
import {required} from '@/helpers/required';
import {showIgnorableNotification} from '@/helpers/userInteraction';
import {DashboardService} from '@/services/dashboard/DashboardService';
import {Telemetry} from '@/TelemetryClient';
export namespace DashboardCommands {
  // Command to bind to UI commands
  export async function startDashboardCmd(): Promise<void> {
    await showIgnorableNotification(Constants.dashboardCommandStrings.connectingDashboardServer, async () => {
      Telemetry.sendEvent('DashboardCommands.startDashboardCmd.commandStarted');

      if (!(await required.checkDashboardVersion())) {
        Telemetry.sendEvent('DashboardCommands.startDashboardCmd.dashboardVersionError');

        const message = Constants.errorMessageStrings.DashboardVersionError;
        const buttonUpdate = Constants.placeholders.buttonTruffleUpdate;
        const buttonClose = Constants.placeholders.buttonClose;

        const item = await window.showErrorMessage(message, buttonUpdate, buttonClose);
        if (item == buttonUpdate) await required.installTruffle();

        return;
      }

      const dashboardProcess = await DashboardService.startDashboardServer(Constants.dashboardPort);

      if (!dashboardProcess.process) {
        Telemetry.sendEvent('DashboardCommands.startDashboardCmd.serverAlreadyRunning');
        void window.showInformationMessage(Constants.dashboardCommandStrings.serverAlreadyRunning);
        return;
      }

      Telemetry.sendEvent('DashboardCommands.startDashboardCmd.commandFinished');
      void window.showInformationMessage(Constants.dashboardCommandStrings.serverSuccessfullyStarted);
    });
  }

  export async function stopDashboardCmd(): Promise<void> {
    Telemetry.sendEvent('DashboardCommands.stopDashboardCmd.commandStarted');

    const port = Constants.dashboardPort;
    const portStatus = await DashboardService.getPortStatus(port);

    if (portStatus === DashboardService.PortStatus.RUNNING) {
      await DashboardService.stopDashboardServer(port);
      Telemetry.sendEvent('DashboardCommands.stopDashboardCmd.isDashboardServer');
      void window.showInformationMessage(Constants.dashboardCommandStrings.serverSuccessfullyStopped);
    } else if (portStatus === DashboardService.PortStatus.FREE) {
      Telemetry.sendEvent('DashboardCommands.stopDashboardCmd.portIsFree');
      void window.showInformationMessage(Constants.dashboardCommandStrings.serverSuccessfullyStopped);
    } else {
      Telemetry.sendEvent('DashboardCommands.stopDashboardCmd.noDashboardServer');
      void window.showWarningMessage(Constants.dashboardCommandStrings.serverCanNotStop);
    }

    Telemetry.sendEvent('DashboardCommands.stopDashboardCmd.commandFinished');
  }
}
