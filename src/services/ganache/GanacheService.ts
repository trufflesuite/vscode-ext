// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Output, OutputLabel} from '@/Output';
import {ChildProcess} from 'child_process';
import {OutputChannel, window} from 'vscode';
import {Constants, RequiredApps} from '../../Constants';
import {spawnProcess} from '@/helpers/command';
import * as shell from '@/helpers/shell';
import {TLocalProjectOptions} from '../../Models/TreeItems/LocalProject';
import {Telemetry} from '../../TelemetryClient';
import {UrlValidator} from '../../validators/UrlValidator';
import {isGanacheServer, waitGanacheStarted} from './GanacheServiceClient';

export namespace GanacheService {
  export interface IGanacheProcess {
    // INFO: THIS IS THE OLD VERSION OF LOGGER USING OUTPUT CHANNELS
    output?: OutputChannel;
    pid?: number;
    port: number | string;
    process?: ChildProcess;
  }

  export const ganacheProcesses: {[port: string]: IGanacheProcess} = {};

  export enum PortStatus {
    FREE = 0,
    GANACHE = 1,
    NOT_GANACHE = 2,
  }

  export async function getPortStatus(port: number | string): Promise<PortStatus> {
    if (!isNaN(await shell.findPid(port))) {
      if (await isGanacheServer(port)) {
        Telemetry.sendEvent('GanacheService.isGanacheServerRunning.isGanacheServer', {port: '' + port});
        return PortStatus.GANACHE;
      } else {
        Telemetry.sendEvent('GanacheService.isGanacheServerRunning.portIsBusy', {port: '' + port});
        return PortStatus.NOT_GANACHE;
      }
    }

    Telemetry.sendEvent('GanacheService.isGanacheServerRunning.portIsFree', {port: '' + port});
    return PortStatus.FREE;
  }

  export async function startGanacheServer(
    port: number | string,
    options?: TLocalProjectOptions
  ): Promise<IGanacheProcess> {
    Telemetry.sendEvent('GanacheService.startGanacheServer');
    if (UrlValidator.validatePort(port)) {
      Telemetry.sendException(new Error(Constants.ganacheCommandStrings.invalidGanachePort));
      throw new Error(`${Constants.ganacheCommandStrings.invalidGanachePort}: ${port}.`);
    }

    const portStatus = await getPortStatus(port);
    if (portStatus === PortStatus.NOT_GANACHE) {
      Telemetry.sendException(new Error(Constants.ganacheCommandStrings.ganachePortIsBusy));
      throw new Error(`${Constants.ganacheCommandStrings.ganachePortIsBusy}: ${port}.`);
    }

    if (portStatus === PortStatus.GANACHE) {
      const pid = await shell.findPid(port);
      ganacheProcesses[port] = ganacheProcesses[port] ? ganacheProcesses[port] : {pid, port};
    }

    if (portStatus === PortStatus.FREE) {
      ganacheProcesses[port] = await spawnGanacheServer(port, options);
    }

    // INFO: THIS IS THE OLD VERSION OF LOGGER USING OUTPUT CHANNELS
    // open the channel to show the output.
    ganacheProcesses[port]?.output?.show(false);

    Telemetry.sendEvent('GanacheServiceClient.waitGanacheStarted.serverStarted');
    return ganacheProcesses[port];
  }

  export async function stopGanacheServer(port: number | string, killOutOfBand = true): Promise<void> {
    return stopGanacheProcess(ganacheProcesses[port], killOutOfBand);
  }

  export function getPortFromUrl(url: string): string {
    const result = url.match(/(:\d{2,4})/);
    return result ? result[0].slice(1) : Constants.defaultLocalhostPort.toString();
  }

  export async function dispose(): Promise<void> {
    const shouldBeFree = Object.values(ganacheProcesses).map((ganacheProcess) =>
      stopGanacheProcess(ganacheProcess, false)
    );
    return Promise.all(shouldBeFree).then(() => undefined);
  }

  async function spawnGanacheServer(port: number | string, options?: TLocalProjectOptions): Promise<IGanacheProcess> {
    const args: string[] = [RequiredApps.ganache, `--port ${port}`];

    if (options?.isForked) {
      if (options.url !== '') args.push(`--fork.url ${options.url}`);

      if (options.forkedNetwork !== Constants.treeItemData.service.local.type.forked.networks.other)
        args.push(`--fork.network ${options.forkedNetwork.toLowerCase()}`);

      if (options.blockNumber > 0) args.push(`--fork.blockNumber ${options.blockNumber}`);
    }

    const process = spawnProcess(undefined, 'npx', args);

    // INFO: THIS IS THE OLD VERSION OF LOGGER USING OUTPUT CHANNELS
    const output = window.createOutputChannel(`${OutputLabel.ganacheCommands}:${port}`);

    const ganacheProcess = {port, process, output} as IGanacheProcess;

    // INFO: THIS IS THE OLD VERSION OF LOGGER USING OUTPUT CHANNELS
    output.show(true);

    try {
      addAllListeners(output, port, process);
      await waitGanacheStarted(port, Constants.ganacheRetryAttempts);
      ganacheProcess.pid = await shell.findPid(port);
    } catch (error) {
      Telemetry.sendException(error as Error);
      await stopGanacheProcess(ganacheProcess, true);
      await Output.dispose(OutputLabel.ganacheCommands, port.toString());
      throw error;
    }

    return ganacheProcess;
  }

  async function stopGanacheProcess(ganacheProcess: IGanacheProcess, killOutOfBand: boolean): Promise<void> {
    if (!ganacheProcess) {
      return;
    }

    const {output, pid, port, process} = ganacheProcess;
    delete ganacheProcesses[port];
    await Output.dispose(OutputLabel.ganacheCommands, port.toString());

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
      Output.outputLine(OutputLabel.ganacheCommands, data.toString(), port.toString());
      output.appendLine(data.toString());
    });

    process.stderr!.on('data', (data: string | Buffer) => {
      Output.outputLine(OutputLabel.ganacheCommands, data.toString(), port.toString());
      output.appendLine(data.toString());
    });

    process.on('exit', () => {
      stopGanacheServer(port);
    });
  }

  function removeAllListeners(process: ChildProcess): void {
    process.stdout!.removeAllListeners();
    process.stderr!.removeAllListeners();
    process.removeAllListeners();
  }
}
