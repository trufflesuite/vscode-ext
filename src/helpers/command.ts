// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ChildProcess, fork, ForkOptions, spawn, SpawnOptions } from 'child_process';
import { tmpdir } from 'os';
import { Constants } from '../Constants';
import { Output } from '../Output';
import { Telemetry } from '../TelemetryClient';

interface IForkMessage {
  command: string;
  message?: string;
  batch?: {
    index: number;
    done: boolean;
    message: string;
  };
}

export interface ICommandResult {
  code: number;
  cmdOutput: string;
  cmdOutputIncludingStderr: string;
  messages?: Array<{[key: string]: any}>;
}

export interface ICommandExecute {
  childProcess: ChildProcess;
  result: Promise<ICommandResult>;
}

export async function executeCommand(workingDirectory: string | undefined, commands: string, ...args: string[])
  : Promise<string> {
  Output.outputLine(
    Constants.outputChannel.executeCommand,
    '\n' +
    `Working dir: ${workingDirectory}\n` +
    `${Constants.executeCommandMessage.runningCommand}\n` +
    `${[commands, ...args].join(' ')}`,
  );

  Telemetry.sendEvent('command.executeCommand.tryExecuteCommandWasStarted');
  const result: ICommandResult = await tryExecuteCommand(workingDirectory, commands, ...args);

  Output.outputLine(
    Constants.outputChannel.executeCommand,
    Constants.executeCommandMessage.finishRunningCommand,
  );

  if (result.code !== 0) {
    Telemetry.sendException(new Error('commands.executeCommand.resultWithIncorrectCode'));
    throw new Error(Constants.executeCommandMessage.failedToRunCommand(commands.concat(' ', ...args.join(' '))));
  }

  return result.cmdOutput;
}

export function spawnProcess(workingDirectory: string | undefined, commands: string, args: string[]): ChildProcess {
  const options: SpawnOptions = { cwd: workingDirectory || tmpdir(), shell: true };
  return spawn(commands, args, options);
}

export async function tryExecuteCommand(workingDirectory: string | undefined, commands: string, ...args: string[])
  : Promise<ICommandResult> {
  const { result } = tryExecuteCommandAsync(workingDirectory, true, commands, ...args);

  return result;
}

export function tryExecuteCommandAsync(
  workingDirectory: string | undefined,
  writeToOutputChannel: boolean,
  commands: string,
  ...args: string[]
): ICommandExecute {
  let cmdOutput: string = '';
  let cmdOutputIncludingStderr: string = '';

  const childProcess = spawnProcess(workingDirectory, commands, args);
  const result = new Promise((resolve: (res: any) => void, reject: (error: Error) => void): void => {
    childProcess.stdout.on('data', (data: string | Buffer) => {
      data = data.toString();
      cmdOutput = cmdOutput.concat(data);
      cmdOutputIncludingStderr = cmdOutputIncludingStderr.concat(data);

      if (writeToOutputChannel) {
        Output.output(Constants.outputChannel.executeCommand, data);
      }
    });

    childProcess.stderr.on('data', (data: string | Buffer) => {
      data = data.toString();
      cmdOutputIncludingStderr = cmdOutputIncludingStderr.concat(data);

      if (writeToOutputChannel) {
        Output.output(Constants.outputChannel.executeCommand, data);
      }
    });

    childProcess.on('error', reject);
    childProcess.on('exit', (code: number) => {
      resolve({ cmdOutput, cmdOutputIncludingStderr, code });
    });
  });

  return {
    childProcess,
    result,
  };
}

export async function executeCommandInFork(workingDirectory: string | undefined, modulePath: string, ...args: string[])
  : Promise<string> {
  Output.outputLine(
    Constants.outputChannel.executeCommand,
    '\n' +
    `Working dir: ${workingDirectory}\n` +
    `${Constants.executeCommandMessage.forkingModule}\n` +
    `${[modulePath, ...args].join(' ')}`,
  );

  Telemetry.sendEvent('command.executeCommandInFork.tryExecuteCommandInForkWasStarted');
  const result: ICommandResult = await tryExecuteCommandInFork(workingDirectory, modulePath, ...args);

  if (result.code !== 0) {
    Telemetry.sendException(new Error('commands.executeCommandInFork.resultWithIncorrectCode'));
    throw new Error(Constants.executeCommandMessage.failedToRunScript(modulePath));
  }

  return result.cmdOutput;
}

export function forkProcess(workingDirectory: string | undefined, modulePath: string, args: string[]): ChildProcess {
  const options: ForkOptions = { cwd: workingDirectory || tmpdir(), silent: true };
  return fork(modulePath, args, options);
}

export async function tryExecuteCommandInFork(
  workingDirectory: string | undefined,
  modulePath: string,
  ...args: string[]
): Promise<ICommandResult> {
  const { result } = tryExecuteCommandInForkAsync(workingDirectory, false, modulePath, ...args);

  return result;
}

export function tryExecuteCommandInForkAsync(
  workingDirectory: string | undefined,
  writeToOutputChannel: boolean,
  modulePath: string,
  ...args: string[]
): ICommandExecute {
  let cmdOutput: string = '';
  let cmdOutputIncludingStderr: string = '';
  const messages: Array<string | object> = [];
  const batches: {[key: string]: string[]} = {};

  const childProcess = forkProcess(workingDirectory, modulePath, args);
  const result = new Promise((resolve: (res: any) => void, reject: (error: Error) => void): void => {
    childProcess.stdout.on('data', (data: string | Buffer) => {
      data = data.toString();
      cmdOutput = cmdOutput.concat(data);
      cmdOutputIncludingStderr = cmdOutputIncludingStderr.concat(data);

      if (writeToOutputChannel) {
        Output.output(Constants.outputChannel.executeCommand, data);
      }
    });

    childProcess.stderr.on('data', (data: string | Buffer) => {
      data = data.toString();
      cmdOutputIncludingStderr = cmdOutputIncludingStderr.concat(data);

      if (writeToOutputChannel) {
        Output.output(Constants.outputChannel.executeCommand, data);
      }
    });

    childProcess.on('message', (message: IForkMessage) => {
      if (message.batch) {
        batches[message.command] = batches[message.command] || [];
        batches[message.command][message.batch.index] = message.batch.message;
        if (message.batch.done) {
          messages.push({command: message.command, message: batches[message.command].join('')});
        }
      } else {
        messages.push(message);
      }

      const data = JSON.stringify(message);
      cmdOutput = cmdOutput.concat(data);
      cmdOutputIncludingStderr = cmdOutputIncludingStderr.concat(data);

      if (writeToOutputChannel) {
        Output.output(Constants.outputChannel.executeCommand, data);
      }
    });

    childProcess.on('error', reject);
    childProcess.on('exit', (code: number) => {
      resolve({ cmdOutput, cmdOutputIncludingStderr, code, messages });
    });
  });

  return { childProcess, result };
}
