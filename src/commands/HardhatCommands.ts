// Copyright (c) 2022. Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Constants, ext, NotificationOptions, OptionalApps} from '@/Constants';

import {convertEntryToUri, getWorkspace, outputCommandHelper} from '@/helpers';
import {required} from '@/helpers/required';
import {showIgnorableNotification, showNotification} from '@/helpers/userInteraction';
import {getPathByPlatform} from '@/helpers/workspace';
import {Output} from '@/Output';
import {Telemetry} from '@/TelemetryClient';
import fs from 'fs-extra';
import path from 'path';
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

  const workspace = await getWorkspace(uri);
  const contractDirectory = getPathByPlatform(workspace);
  const args: string[] = [OptionalApps.hardhat, 'compile'];

  if (uri) {
    const file = convertEntryToUri(uri);
    if (fs.lstatSync(file.fsPath).isFile()) args.push(path.basename(file.fsPath));
  }

  ext.outputChannel.appendLine(`Building: ${args} DIR: ${contractDirectory} WS: ${workspace?.toJSON} `);

  await showIgnorableNotification(Constants.statusBarMessages.buildingContracts, async () => {
    Output.show();
    await outputCommandHelper.executeCommand(contractDirectory, 'npx', args.join(' '));
    commands.executeCommand('truffle-vscode.views.deployments.refresh');

    Telemetry.sendEvent('HardhatCommands.buildContracts.commandFinished');
  });
}
