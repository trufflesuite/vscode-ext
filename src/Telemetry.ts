// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import crypto from 'crypto';
import os from 'os';
import TelemetryReporter, {
  type TelemetryEventMeasurements,
  type TelemetryEventProperties,
} from '@vscode/extension-telemetry';
import {Constants} from './Constants';
import {Output, OutputLabel} from './Output';
import {workspace} from 'vscode';

export const Telemetry = new (class {
  private readonly reporter?: TelemetryReporter;

  private readonly defaultProperties: {[key: string]: any} = {};

  constructor() {
    const enableTelemetry = workspace.getConfiguration('truffle-vscode').get('enableTelemetry');

    if (enableTelemetry) {
      const extensionKey = process.env.AIKEY || Constants.extensionKey;
      try {
        this.reporter = new TelemetryReporter(Constants.extensionName, Constants.extensionVersion, extensionKey);
        // set default values for machine/session ids
        this.defaultProperties['common.vscodemachineid'] = generateMachineId();
        this.defaultProperties['common.vscodesessionid'] = generateSessionId();
      } catch (err) {
        Output.outputLine(OutputLabel.telemetryClient, `Initialize done with error: ${(err as Error).message}`);
      }
    }
  }

  public sendEvent(
    eventName: string,
    properties?: TelemetryEventProperties,
    measurements?: TelemetryEventMeasurements
  ): void {
    const props = {...this.defaultProperties, ...properties};
    if (this.reporter) {
      this.reporter.sendTelemetryEvent(eventName, props, measurements);
    }
  }

  public sendException(
    exception: Error,
    properties?: {[key: string]: string},
    measurements?: {[key: string]: number}
  ): void {
    const props = {...this.defaultProperties, ...properties};
    const error = new Error(exception.message);
    error.stack = '';

    if (this.reporter) {
      this.reporter.sendTelemetryException(error, props, measurements);
    }
  }

  public async dispose(): Promise<void> {
    if (this.reporter) {
      await this.reporter.dispose();
    }
  }
})();

export function obfuscate(data: string): string {
  return crypto.createHash('sha256').update(data).digest('base64');
}

function generateMachineId(): string {
  return crypto.createHash('sha256').update(os.hostname()).digest('base64');
}

function generateSessionId(): string {
  return crypto.randomBytes(16).toString('hex');
}
