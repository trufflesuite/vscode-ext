// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import type {ChildProcess} from 'child_process';
import type {OutputChannel} from 'vscode';
import {Constants} from '../../Constants';
import * as shell from '@/helpers/shell';
import {Telemetry} from '../../TelemetryClient';
import {UrlValidator} from '../../validators/UrlValidator';
import {isGenericServer, getWeb3ClientVersion} from './GenericServiceClient';

export namespace GenericService {
  export interface IGenericProcess {
    output?: OutputChannel;
    pid?: number;
    port: number | string;
    process?: ChildProcess;
  }

  export const genericProcesses: {[port: string]: IGenericProcess} = {};

  export enum PortStatus {
    FREE = 0,
    RUNNING = 1,
    BUSY = 2,
  }

  export async function getPortStatus(port: number | string): Promise<PortStatus> {
    if (!isNaN(await shell.findPid(port))) {
      if (await isGenericServer(port)) {
        Telemetry.sendEvent('GanacheService.isGenericServerRunning.isGenericServer', {port: '' + port});
        return PortStatus.RUNNING;
      } else {
        Telemetry.sendEvent('GanacheService.isGenericServerRunning.portIsBusy', {port: '' + port});
        return PortStatus.BUSY;
      }
    }

    Telemetry.sendEvent('GanacheService.isGenericServerRunning.portIsFree', {port: '' + port});
    return PortStatus.FREE;
  }

  export async function getClientVersion(port: number | string): Promise<string> {
    Telemetry.sendEvent('GenericService.checkForConnection');

    if (UrlValidator.validatePort(port)) {
      Telemetry.sendException(new Error(Constants.genericCommandStrings.invalidPort));
      throw new Error(`${Constants.genericCommandStrings.invalidPort}: ${port}.`);
    }

    const portStatus = await getPortStatus(port);

    if (portStatus === PortStatus.FREE || portStatus === PortStatus.BUSY) {
      Telemetry.sendException(new Error(Constants.genericCommandStrings.invalidPort));
      throw new Error(`${Constants.genericCommandStrings.invalidPort}: ${port}.`);
    }

    if (portStatus === PortStatus.RUNNING) {
      return await getWeb3ClientVersion(port);
    }

    return '';
  }
}
