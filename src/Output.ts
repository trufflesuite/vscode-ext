// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {commands} from 'vscode';
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
  /**
   * Append the given value and a line feed character
   * to the log panel
   *
   * @param label - represents the log type
   * @param message - represents the log text
   * @param description - represents the log description
   */
  public static outputLine(label: OutputLabel, message: string, description?: string): void {
    commands.executeCommand(
      `${Constants.panels.log.viewType}.create.log`,
      label,
      this.formatMessage(label, message),
      description
    );
  }

  /**
   * Remove the log container from the log panel
   *
   * @param label - represents the log type
   * @param description - represents the log description
   */
  public static dispose(label: OutputLabel, description?: string): void {
    commands.executeCommand(`${Constants.panels.log.viewType}.dispose.tab`, label, description);
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
}
