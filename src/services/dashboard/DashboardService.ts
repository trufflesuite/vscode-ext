// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Output, OutputLabel} from '@/Output';
import {ChildProcess} from 'child_process';
import {OutputChannel, window} from 'vscode';
import {Constants, RequiredApps} from '../../Constants';
import {spawnProcess} from '@/helpers/command';
import * as shell from '@/helpers/shell';
import {Telemetry} from '../../TelemetryClient';
import {UrlValidator} from '../../validators/UrlValidator';
import {isDashboardRunning, waitDashboardStarted} from './DashboardServiceClient';

export namespace DashboardService {
  export interface IDashboardProcess {
    // INFO: THIS IS THE OLD VERSION OF LOGGER USING OUTPUT CHANNELS
    output?: OutputChannel;
    pid?: number;
    port: number | string;
    process?: ChildProcess;
  }

  export const dashboardProcesses: {[port: string]: IDashboardProcess} = {};

  export enum PortStatus {
    FREE = 0,
    RUNNING = 1,
    BUSY = 2,
  }

  export async function getPortStatus(port: number | string): Promise<PortStatus> {
    if (!isNaN(await shell.findPid(port))) {
      if (await isDashboardRunning(port)) {
        Telemetry.sendEvent('DashboardService.isDashboardServerRunning.isDashboardServer', {port: '' + port});
        return PortStatus.RUNNING;
      } else {
        Telemetry.sendEvent('DashboardService.isDashboardServerRunning.portIsBusy', {port: '' + port});
        return PortStatus.BUSY;
      }
    }

    Telemetry.sendEvent('DashboardService.isDashboardServerRunning.portIsFree', {port: '' + port});
    return PortStatus.FREE;
  }

  export async function startDashboardServer(port: number | string): Promise<IDashboardProcess> {
    Telemetry.sendEvent('DashboardService.startDashboardServer');

    if (UrlValidator.validatePort(port)) {
      Telemetry.sendException(new Error(Constants.dashboardCommandStrings.invalidDashboardPort));
      throw new Error(`${Constants.dashboardCommandStrings.invalidDashboardPort}: ${port}.`);
    }

    const portStatus = await getPortStatus(port);

    if (portStatus === PortStatus.BUSY) {
      Telemetry.sendException(new Error(Constants.dashboardCommandStrings.dashboardPortIsBusy));
      throw new Error(`${Constants.dashboardCommandStrings.dashboardPortIsBusy}: ${port}.`);
    }

    if (portStatus === PortStatus.RUNNING) {
      const pid = await shell.findPid(port);
      dashboardProcesses[port] = dashboardProcesses[port] ? dashboardProcesses[port] : {pid, port};
    }

    if (portStatus === PortStatus.FREE) {
      dashboardProcesses[port] = await spawnDashboardServer(port);
    }

    // INFO: THIS IS THE OLD VERSION OF LOGGER USING OUTPUT CHANNELS
    // open the channel to show the output.
    dashboardProcesses[port]?.output?.show(false);

    Telemetry.sendEvent('DashboardService.waitDashboardStarted.serverStarted');

    return dashboardProcesses[port];
  }

  export async function stopDashboardServer(port: number | string, killOutOfBand = true): Promise<void> {
    return stopDashboardProcess(dashboardProcesses[port], killOutOfBand);
  }

  export function getPortFromUrl(url: string): string {
    const result = url.match(/(:\d{2,4})/);
    return result ? result[0].slice(1) : Constants.defaultLocalhostPort.toString();
  }

  export async function dispose(): Promise<void> {
    const shouldBeFree = Object.values(dashboardProcesses).map((dashboardProcess) =>
      stopDashboardProcess(dashboardProcess, false)
    );
    return Promise.all(shouldBeFree).then(() => undefined);
  }

  async function spawnDashboardServer(port: number | string): Promise<IDashboardProcess> {
    const process = spawnProcess(undefined, `${RequiredApps.truffle} ${RequiredApps.dashboard}`, []);

    // INFO: THIS IS THE OLD VERSION OF LOGGER USING OUTPUT CHANNELS
    const output = window.createOutputChannel(`${OutputLabel.dashboardCommands}:${port}`);

    const dashboardProcess = {port, process, output} as IDashboardProcess;

    // INFO: THIS IS THE OLD VERSION OF LOGGER USING OUTPUT CHANNELS
    output.show(true);

    try {
      addAllListeners(output, port, process);
      await waitDashboardStarted(port, Constants.dashboardRetryAttempts);
      dashboardProcess.pid = await shell.findPid(port);
    } catch (error) {
      Telemetry.sendException(error as Error);
      await stopDashboardProcess(dashboardProcess, true);
      await Output.dispose(OutputLabel.dashboardCommands, port.toString());
      throw error;
    }

    return dashboardProcess;
  }

  async function stopDashboardProcess(dashboardProcess: IDashboardProcess, killOutOfBand: boolean): Promise<void> {
    if (!dashboardProcess) {
      return;
    }

    const {output, pid, port, process} = dashboardProcess;
    delete dashboardProcesses[port];
    await Output.dispose(OutputLabel.dashboardCommands, port.toString());

    if (process) {
      removeAllListeners(process);
      process.kill('SIGINT');
    }

    // INFO: THIS IS THE OLD VERSION OF LOGGER USING OUTPUT CHANNELS
    if (output) {
      output.dispose();
    }

    if (pid && (killOutOfBand ? true : !!process)) {
      return shell.killPid(pid);
    }
  }

  function addAllListeners(output: OutputChannel, port: number | string, process: ChildProcess): void {
    process.stdout!.on('data', (data: string | Buffer) => {
      Output.outputLine(OutputLabel.dashboardCommands, data.toString(), port.toString());
      output.appendLine(data.toString());
    });

    process.stderr!.on('data', (data: string | Buffer) => {
      Output.outputLine(OutputLabel.dashboardCommands, data.toString(), port.toString());
      output.appendLine(data.toString());
    });

    process.on('exit', () => {
      stopDashboardServer(port);
    });
  }

  function removeAllListeners(process: ChildProcess): void {
    process.stdout!.removeAllListeners();
    process.stderr!.removeAllListeners();
    process.removeAllListeners();
  }
}
