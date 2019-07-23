import * as rp from 'request-promise';
import { Constants } from '../Constants';
import { Telemetry } from '../TelemetryClient';

export async function isGanacheServer(port: number | string): Promise<boolean> {
  try {
    const response = await sendRPCRequest(port, Constants.rpcGanacheMethod);
    return response && !!response.result || false;
  } catch (error) {
    Telemetry.sendException(error);
    return false;
  }
}

export async function waitGanacheStarted(port: number | string, maxRetries: number = 1): Promise<void> {
  const retry = async (retries: number) => {
    if (retries < maxRetries) {
      if (await isGanacheServer(port)) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, Constants.ganacheRetryTimeout));
      await retry(retries + 1);
    } else {
      const error = new Error(Constants.ganacheCommandStrings.cannotStartServer);
      Telemetry.sendException(error);
      throw error;
    }
  };
  await retry(0);
}

export async function sendRPCRequest(
  port: number | string,
  methodName: string,
): Promise<{ result?: any } | undefined> {
  return rp.post(
    `http://${Constants.localhost}:${port}`,
    {
      body: {
        jsonrpc: '2.0',
        method: methodName,
        params: [],
      },
      json: true,
    })
    .then((result) => result)
    .catch(() => undefined);
}
