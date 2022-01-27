// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import crypto from "crypto";
import os from "os";
import {OutputChannel, window, workspace} from "vscode";
import TelemetryReporter from "vscode-extension-telemetry";
import {Constants} from "./Constants";
import {Output} from "./Output";

class ExtensionTelemetry {
  private readonly output?: OutputChannel;
  private readonly reporter?: TelemetryReporter;
  private readonly defaultProperties: {[key: string]: any} = {};

  constructor() {
    const isEnableTelemetry = workspace.getConfiguration("telemetry").get("enableTelemetry") || true;
    const isTestRun = process.env.CODE_TEST || false;
    // make testing easier.
    const extensionKey = process.env.AIKEY || Constants.extensionKey;
    if (isEnableTelemetry) {
      if (isTestRun) {
        this.output = window.createOutputChannel(Constants.outputChannel.telemetryClient);
      } else {
        try {
          this.reporter = new TelemetryReporter(Constants.extensionName, Constants.extensionVersion, extensionKey);
          // set default values for machine/session ids
          this.defaultProperties["common.vscodemachineid"] = generateMachineId();
          this.defaultProperties["common.vscodesessionid"] = generateSessionId();
        } catch (error) {
          Output.outputLine(
            Constants.outputChannel.telemetryClient,
            `Initialize done with error: ${(error as Error).message}`
          );
        }
      }
    }
  }

  public sendEvent(
    eventName: string,
    properties?: {[key: string]: string},
    measurements?: {[key: string]: number}
  ): void {
    const props = Object.assign({}, this.defaultProperties, properties);
    if (this.reporter) {
      this.reporter.sendTelemetryEvent(eventName, props, measurements);
    }

    if (this.output) {
      this.output.appendLine(`telemetry/${eventName} ${JSON.stringify({props, measurements})}`);
    }
  }

  public sendException(
    exception: Error,
    properties?: {[key: string]: string},
    measurements?: {[key: string]: number}
  ): void {
    const props = Object.assign({}, this.defaultProperties, properties);
    const error = new Error(exception.message);
    error.stack = "";

    if (this.reporter) {
      this.reporter.sendTelemetryException(error, props, measurements);
    }

    if (this.output) {
      this.output.appendLine(`telemetry/${error} ${JSON.stringify({props, measurements})}`);
    }
  }

  public obfuscate(data: string): string {
    return crypto.createHash("sha256").update(data).digest("base64");
  }

  public async dispose(): Promise<void> {
    if (this.reporter) {
      await this.reporter.dispose();
    }

    if (this.output) {
      await this.output.dispose();
    }
  }
}

function generateMachineId(): string {
  return crypto.createHash("sha256").update(os.hostname()).digest("base64");
}

function generateSessionId(): string {
  return crypto.randomBytes(16).toString("hex");
}

export const Telemetry = new ExtensionTelemetry();
