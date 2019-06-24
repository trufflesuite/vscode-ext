// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { executeCommand, tryExecuteCommand } from './command';

const isWin = process.platform === 'win32';

export async function killPort(port: string | number): Promise<void> {
  const pid = await findPid(port);
  if (isNaN(pid)) {
    return;
  }

  const killCommand = isWin ? `taskkill /PID ${pid} /F` : `kill -TERM ${pid}`;

  await executeCommand(undefined, killCommand);
}

export async function findPid(port: string | number): Promise<number> {
  let pid;
  let output = '';

  if (isWin) {
    output = (await tryExecuteCommand(
        undefined,
        `netstat -ano -p tcp | find "LISTENING" | findstr /r /c:":${port} *[^ ]*:[^ ]*"`))
      .cmdOutput;
  } else {
    output = (await tryExecuteCommand(undefined, `lsof -i tcp:${port} | grep LISTEN | awk '{print $2}'`)).cmdOutput;
  }

  pid = output.match(/\s+\d+\s+$/);

  return pid ? parseInt(pid[0].trim(), 10) : Number.NaN;
}
