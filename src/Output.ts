// Copyright (c) 2022. Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {ExtensionContext, OutputChannel, window} from 'vscode';

export enum OutputLabel {
  truffleForVSCode = 'Truffle for VSCode',
  executeCommand = 'Truffle: Execute command',
  ganacheCommands = 'Truffle: Ganache Server',
  genericCommands = 'Truffle: Generic Server',
  dashboardCommands = 'Truffle: Dashboard Server',
  requirements = 'Truffle: Requirements',
  telemetryClient = 'Truffle: Telemetry Client',
  treeManager = 'Truffle: Service Tree Manager',
  sdkCoreCommands = 'Truffle: SDK Commands',
  hardhatCommands = 'Truffle: Hardhat Commands',
}

export class Output {
  public static output(label: OutputLabel, message: string): void {
    this._outputChannel.append(this.formatMessage(label, message));
  }

  public static outputLine(label: OutputLabel, message: string): void {
    this._outputChannel.appendLine(this.formatMessage(label, message));
  }

  public static info(label: OutputLabel, message: string): void {
    this.outputLine(label, message);
  }

  public static show(): void {
    this._outputChannel.show();
  }

  public static hide(): void {
    this._outputChannel.hide();
  }

  public static dispose(): void {
    this._outputChannel.dispose();
  }

  private static _outputChannel: OutputChannel = window.createOutputChannel(OutputLabel.truffleForVSCode);

  private static formatMessage(label = '', message = ''): string {
    return `${label ? `[${label}] ` : ''}${message}`;
  }

  /**
   * Call this only once to push the outputChannel into the list of subscriptions.
   */
  public static init(context: ExtensionContext) {
    context.subscriptions.push(this._outputChannel);
    outputChannel = this._outputChannel;
  }
}

export declare let outputChannel: OutputChannel;

type OutputInstance = {
  output(message: string): void;
  outputLine(message: string): void;
  info(message: string): void;
};

/**
 * Helper to create a curried wrapper around the output channel as a
 * convenience when logging. Save for verbose log commands in classes.
 *
 * @param label - The output label you wish to append to all your calls.
 * @return OutputInstance - The convenience type wrapping this.
 */
export function createOutputInst(label: OutputLabel): OutputInstance {
  return {
    info(message: string): void {
      Output.info(label, message);
    },
    output(message: string): void {
      Output.output(label, message);
    },
    outputLine(message: string): void {
      Output.outputLine(label, message);
    },
  };
}
