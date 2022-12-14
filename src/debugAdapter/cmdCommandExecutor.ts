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

interface ICommandResult {
  code: number;
  cmdOutput: string;
  cmdOutputIncludingStderr: string;
  messages?: Array<{[key: string]: any}>;
}

interface ICommandExecute {
  childProcess: cp.ChildProcess;
  result: Promise<ICommandResult>;
}

function forkProcess(workingDirectory: string | undefined, modulePath: string, args: string[]): cp.ChildProcess {
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

function tryExecuteCommandInForkAsync(
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
