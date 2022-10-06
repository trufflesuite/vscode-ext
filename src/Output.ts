// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {commands, ExtensionContext, window} from 'vscode';
import {LogView} from './views/LogView';

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
  private static readonly _outputChannel = window.createOutputChannel(OutputLabel.truffleForVSCode);

  /**
   * Append the given value and a line feed character
   * to the log panel
   *
   * @param label - represents the log type
   * @param message - represents the log text
   * @param description - represents the log description
   */
  public static outputLine(label: OutputLabel, message: string, description?: string): void {
    commands.executeCommand(`${LogView.viewType}.create.log`, label, this.formatMessage(label, message), description);

    // INFO: THIS IS THE OLD VERSION OF LOGGER USING OUTPUT CHANNELS
    this._outputChannel.appendLine(this.formatMessage(label, message));
  }

  /**
   * Remove the log container from the log panel
   *
   * @param label - represents the log type
   * @param description - represents the log description
   */
  public static dispose(label: OutputLabel, description?: string): void {
    commands.executeCommand(`${LogView.viewType}.dispose.tab`, label, description);
  }

  /**
   * Format the text of the message that will be printed
   *
   * @param label - represents the log type
   * @param message - represents the log text
   */
  private static formatMessage(label = '', message = ''): string {
    return `${label ? `[${label}] ` : ''}${message}`;
  }

  /**
   * INFO: THIS IS THE OLD VERSION OF LOGGER USING OUTPUT CHANNELS
   * Call this only once to push the outputChannel into the list of subscriptions.
   */
  public static init(context: ExtensionContext) {
    context.subscriptions.push(this._outputChannel);
    this._outputChannel.show();
  }
}
