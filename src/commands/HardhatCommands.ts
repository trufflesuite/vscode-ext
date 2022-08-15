// Copyright (c) 2022. Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Constants, NotificationOptions, OptionalApps} from '@/Constants';

import {outputCommandHelper} from '@/helpers';
import {required} from '@/helpers/required';
import {showIgnorableNotification, showNotification} from '@/helpers/userInteraction';
import {AbstractWorkspaceManager} from '@/helpers/workspace';
import {Output, OutputLabel} from '@/Output';
import {Telemetry} from '@/TelemetryClient';
import {commands, Uri} from 'vscode';

export async function buildContracts(uri?: Uri): Promise<void> {
  Telemetry.sendEvent('HardhatCommands.buildContracts.commandStarted');

  if (!(await required.checkAppsSilent(OptionalApps.hardhat))) {
    Telemetry.sendEvent('HardhatCommands.buildContracts.hardhatInstallationMissing');
    await showNotification({
      message: 'Hardhat is not installed, please install to continue...',
      type: NotificationOptions.error,
    });
    // await required.installHardhat(required.Scope.locally);
    return;
  }

  const ret = await AbstractWorkspaceManager.getWorkspaceForUri(uri);
  Output.outputLine(OutputLabel.hardhatCommands, `found workspaces: ${JSON.stringify(ret)}`);
  const args: string[] = [OptionalApps.hardhat, 'compile'];
  const contractDirectory = ret.workspace.fsPath;

  // hardhat will compile all contracts, not one specifically.

  Output.outputLine(
    OutputLabel.hardhatCommands,
    `Building: ${args} DIR: ${contractDirectory} Workspace: ${JSON.stringify(ret)} `
  );

  await showIgnorableNotification(Constants.statusBarMessages.buildingContracts, async () => {
    Output.show();
    await outputCommandHelper.executeCommand(contractDirectory, 'npx', args.join(' '));
    commands.executeCommand('truffle-vscode.views.deployments.refresh');

    Telemetry.sendEvent('HardhatCommands.buildContracts.commandFinished');
  });
}
