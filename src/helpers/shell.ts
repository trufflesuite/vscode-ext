import { executeCommand } from './command';

const isWin = process.platform === 'win32';

export async function freePort(port: string | number): Promise<void> {
  const pid = await findPid(port);

  const killCommand = isWin ? `taskkill /PID ${pid} /F` : `kill -TERM ${pid}`;

  await executeCommand(undefined, killCommand);
}

async function findPid(port: string | number): Promise<number> {
  let pid;

  if (isWin) {
    const pidLine = await executeCommand(undefined, `netstat -ano -p tcp | find "LISTENING" | find ":${port}"`);

    pid = pidLine.match(/\s+\d+\s+$/);

    return pid ? parseInt(pid[0].trim(), 10) : -1;
  }

  pid = await executeCommand(undefined, `lsof -i tcp:${port} | grep LISTEN | awk '{print $2}'`);

  return parseInt(pid, 10);
}
