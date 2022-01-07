// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import * as requestPromise from "request-promise";
import { Constants } from "../Constants";
import { Telemetry } from "../TelemetryClient";

const requestTimeout = 10000;

export namespace HttpService {
  export async function sendRPCRequest(
    host: string,
    methodName: string,
    parameters?: string[]
  ): Promise<{ result?: any; error?: any } | undefined> {
    const address = hasProtocol(host) ? host : `${Constants.networkProtocols.http}${host}`;
    return requestPromise
      .post(address, {
        body: {
          id: 1,
          jsonrpc: "2.0",
          method: methodName,
          params: parameters || [],
        },
        json: true,
        timeout: requestTimeout,
      })
      .catch((_errorMessage) => {
        Telemetry.sendException(new Error(`HttpService.sendRPCRequest has done with error for method: ${methodName}`));

        return undefined;
      });
  }

  function hasProtocol(host: string): boolean {
    return host.indexOf(Constants.networkProtocols.http) === 0 || host.indexOf(Constants.networkProtocols.https) === 0;
  }
}
