// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Constants } from '../Constants';
import { HttpService } from '../services';
import { Telemetry } from '../TelemetryClient';

export async function isGanacheServer(port: number | string): Promise<boolean> {
  try {
    const response = await HttpService.sendRPCRequest(
      `http://${Constants.localhost}:${port}`,
      Constants.rpcMethods.netListening);
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
