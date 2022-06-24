// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Constants} from '../../Constants';
import {Telemetry} from '../../TelemetryClient';
import {HttpService} from '../HttpService';

export async function isGenericServer(port: number | string): Promise<boolean> {
  try {
    const response = await HttpService.sendRPCRequest(
      `http://${Constants.localhost}:${port}`,
      Constants.rpcMethods.netListening
    );
    return (response && !!response.result) || false;
  } catch (error) {
    Telemetry.sendException(error as Error);
    return false;
  }
}

export async function getWeb3ClientVersion(port: number | string): Promise<any> {
  try {
    const response = await HttpService.sendRPCRequest(
      `http://${Constants.localhost}:${port}`,
      Constants.rpcMethods.web3_clientVersion
    );

    return response?.result;
  } catch (error) {
    Telemetry.sendException(error as Error);
  }
}
