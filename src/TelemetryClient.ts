// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import crypto from 'crypto';
import os from 'os';
import {workspace} from 'vscode';
import TelemetryReporter, {
  type TelemetryEventMeasurements,
  type TelemetryEventProperties,
} from '@vscode/extension-telemetry';
import {Constants} from './Constants';
import {Output, OutputLabel} from './Output';

class ExtensionTelemetry {
  private readonly reporter?: TelemetryReporter;

  private readonly defaultProperties: {[key: string]: any} = {};

  constructor() {
    const isEnableTelemetry = workspace.getConfiguration('telemetry').get('enableTelemetry') || true;
    // make testing easier.
    const extensionKey = process.env.AIKEY || Constants.extensionKey;
    if (isEnableTelemetry) {
      try {
        this.reporter = new TelemetryReporter(extensionKey);
        // set default values for machine/session ids
        this.defaultProperties['common.vscodemachineid'] = generateMachineId();
        this.defaultProperties['common.vscodesessionid'] = generateSessionId();
      } catch (error) {
        Output.outputLine(OutputLabel.telemetryClient, `Initialize done with error: ${(error as Error).message}`);
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

  public obfuscate(data: string): string {
    return crypto.createHash('sha256').update(data).digest('base64');
  }

  public async dispose(): Promise<void> {
    if (this.reporter) {
      await this.reporter.dispose();
    }
  }
}

function generateMachineId(): string {
  return crypto.createHash('sha256').update(os.hostname()).digest('base64');
}

function generateSessionId(): string {
  return crypto.randomBytes(16).toString('hex');
}

export const Telemetry = new ExtensionTelemetry();
