import * as cp from 'child_process';
import * as os from 'os';

// The same implementation as in helpers/truffleConfig.ts
// The difference is that all code which uses 'vscode' module is removed.
// TODO: think how to reuse code
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
    const result: ICommandResult = await tryExecuteCommand(workingDirectory, commands, ...args);

    if (result.code !== 0) {
      throw new Error('Error while executin command: ' + commands.concat(' ', ...args.join(' ')));
    }

    return result.cmdOutput;
}

async function tryExecuteCommand(workingDirectory: string | undefined, commands: string, ...args: string[])
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
    });

    childProcess.stderr.on('data', (data: string | Buffer) => {
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
