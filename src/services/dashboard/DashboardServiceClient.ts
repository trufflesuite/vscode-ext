// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Constants} from '../../Constants';
import {Telemetry} from '../../TelemetryClient';
import {HttpService} from '../HttpService';

export async function isDashboardRunning(port: number | string): Promise<boolean> {
  try {
    const response = await HttpService.sendHttpGetRequest(`http://${Constants.localhost}:${port}`);
    return (response && response === 200) || false;
  } catch (error) {
    Telemetry.sendException(error as Error);
    return false;
  }
}

export async function waitDashboardStarted(port: number | string, maxRetries = 1): Promise<void> {
  const retry = async (retries: number) => {
    if (retries < maxRetries) {
      if (await isDashboardRunning(port)) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, Constants.dashboardRetryTimeout));
      await retry(retries + 1);
    } else {
      const error = new Error(Constants.ganacheCommandStrings.cannotStartServer);
      Telemetry.sendException(error);
      throw error;
    }
  };
  await retry(0);
}
