// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import TelemetryReporter from 'vscode-extension-telemetry';
import { Constants } from './Constants';
import { Output } from './Output';

export class TelemetryClient {
  public static initialize() {
    try {
      this._client = new TelemetryReporter(Constants.extensionId, Constants.extensionVersion, Constants.extensionKey);
    } catch (e) {
      Output.outputLine(Constants.outputChannel.telemetryClient, `Initialize done with error: ${e.message}`);
    }
  }

  public static sendEvent(eventName: string, properties?: { [key: string]: string; }): void {
    if (!this._client) {
      return;
    }

    this._client.sendTelemetryEvent(eventName, properties);
  }

  private static _client: TelemetryReporter;
}
