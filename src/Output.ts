// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {commands, ExtensionContext, OutputChannel, window} from 'vscode';
import {Constants} from './Constants';

export enum OutputLabel {
  truffleForVSCode = 'Truffle for VSCode',
  executeCommand = 'Truffle: Execute command',
  ganacheCommands = 'Truffle: Ganache Server',
  genericCommands = 'Truffle: Generic Server',
  dashboardCommands = 'Truffle: Dashboard Server',
  requirements = 'Truffle: Requirements',
  telemetryClient = 'Truffle: Telemetry Client',
  treeManager = 'Truffle: Service Tree Manager',
}

export class Output {
  public static output(label: OutputLabel, message: string, description?: string): void {
    this._outputChannel.append(this.formatMessage(label, message));
    commands.executeCommand(
      `${Constants.panels.log.viewType}.addLog`,
      label,
      this.formatMessage(label, message),
      description
    );
  }

  public static outputLine(label: OutputLabel, message: string, description?: string): void {
    this._outputChannel.appendLine(this.formatMessage(label, message));
    commands.executeCommand(
      `${Constants.panels.log.viewType}.addLog`,
      label,
      this.formatMessage(label, message),
      description
    );
  }

  public static info(label: OutputLabel, message: string, description?: string): void {
    this.outputLine(label, message);
    commands.executeCommand(
      `${Constants.panels.log.viewType}.addLog`,
      label,
      this.formatMessage(label, message),
      description
    );
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
