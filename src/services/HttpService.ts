// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import requestPromise from 'request-promise';
import {Constants} from '../Constants';
import {Telemetry} from '../TelemetryClient';

const requestTimeout = 10000;

export namespace HttpService {
  export async function sendRPCRequest(
    host: string,
    methodName: string,
    parameters?: string[]
  ): Promise<{result?: any; error?: any} | undefined> {
    const address = hasProtocol(host) ? host : `${Constants.networkProtocols.http}${host}`;
    return requestPromise
      .post(address, {
        body: {
          id: 1,
          jsonrpc: '2.0',
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

  export async function sendHttpGetRequest(url: string): Promise<{result?: any; error?: any} | undefined> {
    const address = hasProtocol(url) ? url : `${Constants.networkProtocols.http}${url}`;
    return requestPromise
      .get(address, {
        timeout: requestTimeout,
        resolveWithFullResponse: true,
      })
      .then((response) => {
        return response.statusCode;
      })
      .catch((_errorMessage) => {
        Telemetry.sendException(new Error(`HttpService.sendHttpGetRequest has done with error for URL: ${url}`));
        return undefined;
      });
  }

  function hasProtocol(host: string): boolean {
    return host.indexOf(Constants.networkProtocols.http) === 0 || host.indexOf(Constants.networkProtocols.https) === 0;
  }
}
