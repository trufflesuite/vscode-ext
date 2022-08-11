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
  public static output(label: OutputLabel, message: string, description?: string): void {
    commands.executeCommand(
      `${Constants.panels.log.viewType}.addLog`,
      label,
      this.formatMessage(label, message),
      description
    );
  }

  public static outputLine(label: OutputLabel, message: string, description?: string): void {
    commands.executeCommand(
      `${Constants.panels.log.viewType}.addLog`,
      label,
      this.formatMessage(label, message),
      description
    );
  }

  public static info(label: OutputLabel, message: string, description?: string): void {
    commands.executeCommand(
      `${Constants.panels.log.viewType}.addLog`,
      label,
      this.formatMessage(label, message),
      description
    );
  }

  private static formatMessage(label = '', message = ''): string {
    return `${label ? `[${label}] ` : ''}${message}`;
  }
}
