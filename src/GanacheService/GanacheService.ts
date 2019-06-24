// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import { ChildProcess, spawn } from 'child_process';
import { OutputChannel, window } from 'vscode';
import { Constants } from '../Constants';
import { shell } from '../helpers';
import { UrlValidator } from '../validators/UrlValidator';
import { isGanacheServer, waitGanacheStarted } from './GanacheServiceClient';

export namespace GanacheService {

  export interface IGanacheProcess {
    process: ChildProcess;
    output: OutputChannel;
  }

  export const ganacheProcesses: { [port: string]: IGanacheProcess } = {};

  export async function startGanacheServer(port: number | string)
    : Promise<IGanacheProcess | null> {
    if (UrlValidator.validatePort(port)) {
      throw new Error(`${Constants.ganacheCommandStrings.invalidGanachePort}: ${port}.`);
    }

    if (!isNaN(await shell.findPid(port))) {
      if (await isGanacheServer(port)) {
        return null;
      } else {
        throw new Error(Constants.ganacheCommandStrings.cannotStartServer);
      }
    }

    const process = spawn('npx', ['ganache-cli', `-p ${port}`], { shell: true });
    const output = window.createOutputChannel(`${Constants.outputChannel.ganacheCommands}:${port}`);
    output.show();

    process.stdout.on('data', (data: string | Buffer) => {
      output.appendLine(data.toString());
    });

    process.stderr.on('data', (data: string | Buffer) => {
      output.appendLine(data.toString());
    });

    process.on('close', () => {
      delete ganacheProcesses[port];
      output.dispose();
    });

    try {
      await waitGanacheStarted(port, Constants.ganacheRetryAttempts);
    } catch (e) {
      process.removeAllListeners();
      output.dispose();
      shell.killPort(port);
      throw e;
    }

    const ganacheProcess = { process, output };
    ganacheProcesses[port] = ganacheProcess;
    return ganacheProcess;
  }

  export async function stopGanacheServer(port: number | string): Promise<void> {
    await shell.killPort(port);

    const ganacheProcess = ganacheProcesses[port];
    if (ganacheProcess) {
      ganacheProcess.process.removeAllListeners();
      ganacheProcess.output.dispose();
      delete ganacheProcesses[port];
    }
  }

  export async function dispose(): Promise<void[]> {
    const shouldBeFree: Array<Promise<void>> = [];

    Object.keys(ganacheProcesses).forEach((port) => {
      delete ganacheProcesses[port];
      shouldBeFree.push(shell.killPort(port));
    });

    return Promise.all(shouldBeFree);
  }

  export function getPortFromUrl(url: string): string {
    const result = url.match(/(:\d{2,4})/);
    return result ? result[0].slice(1) : Constants.defaultLocalhostPort.toString();
  }
}
