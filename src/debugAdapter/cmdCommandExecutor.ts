// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import cp from 'child_process';
import os from 'os';

// The same implementation as in helpers/command.ts
// The difference is that all code which uses 'vscode' module is removed.
// TODO: think how to reuse code
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
  childProcess: cp.ChildProcess;
  result: Promise<ICommandResult>;
}

export async function executeCommand(
  workingDirectory: string | undefined,
  commands: string,
  ...args: string[]
): Promise<string> {
  const result: ICommandResult = await tryExecuteCommand(workingDirectory, commands, ...args);

  if (result.code !== 0) {
    throw new Error('Error while execution command: ' + commands.concat(' ', ...args.join(' ')));
  }

  return result.cmdOutput;
}

async function tryExecuteCommand(
  workingDirectory: string | undefined,
  commands: string,
  ...args: string[]
): Promise<ICommandResult> {
  return new Promise((resolve: (res: any) => void, reject: (error: Error) => void): void => {
    let cmdOutput = '';
    let cmdOutputIncludingStderr = '';

    const options: cp.SpawnOptions = {cwd: workingDirectory || os.tmpdir(), shell: true};
    const childProcess: cp.ChildProcess = cp.spawn(commands, args, options);

    childProcess.stdout!.on('data', (data: string | Buffer) => {
      data = data.toString();
      cmdOutput = cmdOutput.concat(data);
      cmdOutputIncludingStderr = cmdOutputIncludingStderr.concat(data);
    });

    childProcess.stderr!.on('data', (data: string | Buffer) => {
      data = data.toString();
      cmdOutputIncludingStderr = cmdOutputIncludingStderr.concat(data);
    });

    childProcess.on('error', reject);
    childProcess.on('close', (code: number) => {
      resolve({
        cmdOutput,
        cmdOutputIncludingStderr,
        code,
      });
    });
  });
}

export async function executeCommandInFork(
  workingDirectory: string | undefined,
  modulePath: string,
  ...args: string[]
): Promise<string> {
  const result: ICommandResult = await tryExecuteCommandInFork(workingDirectory, modulePath, ...args);

  if (result.code !== 0) {
    throw new Error(`Failed to run script - ${modulePath}. More details in output`);
  }

  return result.cmdOutput;
}

export function forkProcess(workingDirectory: string | undefined, modulePath: string, args: string[]): cp.ChildProcess {
  const options: cp.ForkOptions = {cwd: workingDirectory || os.tmpdir(), silent: true};
  return cp.fork(modulePath, args, options);
}

export async function tryExecuteCommandInFork(
  workingDirectory: string | undefined,
  modulePath: string,
  ...args: string[]
): Promise<ICommandResult> {
  const {result} = tryExecuteCommandInForkAsync(workingDirectory, modulePath, ...args);

  return result;
}

export function tryExecuteCommandInForkAsync(
  workingDirectory: string | undefined,
  modulePath: string,
  ...args: string[]
): ICommandExecute {
  let cmdOutput = '';
  let cmdOutputIncludingStderr = '';
  const messages: Array<string | object> = [];
  const batches: {[key: string]: string[]} = {};

  const childProcess = forkProcess(workingDirectory, modulePath, args);
  const result = new Promise((resolve: (res: any) => void, reject: (error: Error) => void): void => {
    childProcess.stdout!.on('data', (data: string | Buffer) => {
      data = data.toString();
      cmdOutput = cmdOutput.concat(data);
      cmdOutputIncludingStderr = cmdOutputIncludingStderr.concat(data);
    });

    childProcess.stderr!.on('data', (data: string | Buffer) => {
      data = data.toString();
      cmdOutputIncludingStderr = cmdOutputIncludingStderr.concat(data);
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
    });

    childProcess.on('error', reject);
    childProcess.on('exit', (code: number) => {
      resolve({cmdOutput, cmdOutputIncludingStderr, code, messages});
    });
  });

  return {childProcess, result};
}
