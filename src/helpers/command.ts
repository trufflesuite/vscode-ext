// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as cp from 'child_process';
import * as os from 'os';
import { Constants } from '../Constants';
import { Output } from '../Output';

export interface ICommandResult {
  code: number;
  cmdOutput: string;
  cmdOutputIncludingStderr: string;
}

export async function executeCommand(
  workingDirectory: string | undefined,
  commands: string,
  ...args: string[]
): Promise<string> {
  Output.outputLine(
    Constants.outputChannel.executeCommand,
    '\n' +
    `Working dir: ${workingDirectory}\n` +
    `${Constants.executeCommandMessage.runningCommand}\n` +
    `${[commands, ...args].join(' ')}`,
  );

  const result: ICommandResult = await tryExecuteCommand(workingDirectory, commands, ...args);

  Output.outputLine(
    Constants.outputChannel.executeCommand,
    Constants.executeCommandMessage.finishRunningCommand,
  );

  if (result.code !== 0) {
    Output.show();
    throw Error(Constants.executeCommandMessage.failedToRunCommand(commands.concat(' ', ...args.join(' '))));
  }

  return result.cmdOutput;
}

export function startProcess(
  workingDirectory: string | undefined,
  commands: string,
  args: string[],
): cp.ChildProcess {
  const options: cp.SpawnOptions = { cwd: workingDirectory || os.tmpdir(), shell: true };
  const process = cp.spawn(commands, args, options);

  return process;
}

export async function tryExecuteCommand(workingDirectory: string | undefined, commands: string, ...args: string[])
  : Promise<ICommandResult> {
  return new Promise((resolve: (res: any) => void, reject: (error: Error) => void): void => {
    let cmdOutput: string = '';
    let cmdOutputIncludingStderr: string = '';

    const options: cp.SpawnOptions = { cwd: workingDirectory || os.tmpdir(), shell: true };
    const childProcess: cp.ChildProcess = cp.spawn(commands, args, options);

    childProcess.stdout.on('data', (data: string | Buffer) => {
      data = data.toString();
      cmdOutput = cmdOutput.concat(data);
      cmdOutputIncludingStderr = cmdOutputIncludingStderr.concat(data);

      Output.output(Constants.outputChannel.executeCommand, data);
    });

    childProcess.stderr.on('data', (data: string | Buffer) => {
      data = data.toString();
      cmdOutputIncludingStderr = cmdOutputIncludingStderr.concat(data);

      Output.output(Constants.outputChannel.executeCommand, data);
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
