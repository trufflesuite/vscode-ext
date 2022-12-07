// Copyright (c) 2022. Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Constants, NotificationOptions, OptionalApps} from '@/Constants';

import {outputCommandHelper} from '@/helpers';
import {required} from '@/helpers/required';
import {showIgnorableNotification, showNotification} from '@/helpers/userInteraction';
import {AbstractWorkspace} from '@/helpers/AbstractWorkspace';
import {Output, OutputLabel} from '@/Output';
import {Telemetry} from '@/TelemetryClient';
import {commands, Uri} from 'vscode';

export async function buildContracts(ws: AbstractWorkspace, uri?: Uri): Promise<void> {
  Telemetry.sendEvent('HardhatCommands.buildContracts.commandStarted');
  if (!(await required.checkAppsSilentForUri(ws.workspace, OptionalApps.hardhat))) {
    Telemetry.sendEvent('HardhatCommands.buildContracts.hardhatInstallationMissing');
    await showNotification({
      message: 'Hardhat is not installed, please install to continue...',
      type: NotificationOptions.error,
    });
    // await required.installHardhat(required.Scope.locally);
    return;
  }

  const workspaceDir = ws.workspace.fsPath;

  Output.outputLine(OutputLabel.hardhatCommands, `compiling: ${JSON.stringify(uri)} : ${workspaceDir}`);
  const args: string[] = [OptionalApps.hardhat, 'compile'];

  // hardhat will compile all contracts, not one specifically.
  Output.outputLine(
    OutputLabel.hardhatCommands,
    `Building: ${args} DIR: ${workspaceDir} Workspace: ${JSON.stringify(ws)} `
  );

  await showIgnorableNotification(Constants.statusBarMessages.buildingContracts, async () => {
    Output.show();
    await outputCommandHelper.executeCommand(workspaceDir, 'npx', args.join(' '));
    commands.executeCommand('truffle-vscode.views.deployments.refresh');

    Telemetry.sendEvent('HardhatCommands.buildContracts.commandFinished');
  });
}
