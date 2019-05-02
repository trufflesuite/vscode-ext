// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ChildProcess, spawn } from 'child_process';
import { OutputChannel, window } from 'vscode';
import { Constants } from '../Constants';
import { CommandContext, required, setCommandContext, shell } from '../helpers';

let server: ChildProcess | undefined;

export namespace GanacheCommands {
  const ganacheOutputChannel: OutputChannel = window.createOutputChannel(Constants.outputChannel.ganacheCommands);

  // Command to bind to UI commands
  export async function startGanacheCmd(): Promise<void> {
    if (server) {
      window.showInformationMessage(Constants.ganacheCommandStrings.serverAlreadyRunning);
      return;
    }

    await startGanacheServer();

    if (server) {
      (server as ChildProcess).on('error',
        () => window.showErrorMessage(Constants.ganacheCommandStrings.serverAlreadyRunning));
    }

    window.showInformationMessage(Constants.ganacheCommandStrings.serverSuccessfullyRunning);
  }

  // Command to bind to UI commands
  export async function stopGanacheCmd(): Promise<void> {
    if (!server) {
      window.showInformationMessage(Constants.ganacheCommandStrings.serverCanNotStop);
      return;
    }

    return stopGanacheServer();
  }

  export async function startGanacheServer(): Promise<void> {
    if (!server && await required.checkRequiredApps()) {
      server = spawn('npx', ['ganache-cli'], { shell: true });
      server.stdout.on('data', (data: string | Buffer) => {
        ganacheOutputChannel.appendLine(data.toString());
      });

      server.stderr.on('data', (data: string | Buffer) => {
        ganacheOutputChannel.appendLine(data.toString());
      });

      setCommandContext(
        CommandContext.IsGanacheRunning,
        true,
      );
    }
  }

  export async function stopGanacheServer(): Promise<void> {
    if (server) {
      await shell.freePort(Constants.defaultLocalhostPort);
      server.removeAllListeners();
      server = undefined;
      window.showInformationMessage(Constants.ganacheCommandStrings.serverSuccessfullyStopped);
    }
    setCommandContext(CommandContext.IsGanacheRunning, false);
  }

  export async function dispose(): Promise<void> {
    if (server) {
      server = undefined;
      return shell.freePort(Constants.defaultLocalhostPort);
    }
  }
}
