// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { commands, QuickPickItem, window } from 'vscode';
import { Constants, RequiredApps } from '../Constants';
import { GanacheService } from '../GanacheService/GanacheService';
import { isGanacheServer } from '../GanacheService/GanacheServiceClient';
import { required, showQuickPick } from '../helpers';
import { ItemType, LocalNetworkConsortium } from '../Models';
import { Output } from '../Output';
import { Telemetry } from '../TelemetryClient';
import { ConsortiumTreeManager } from '../treeService/ConsortiumTreeManager';
import { ConsortiumView } from '../ViewItems';

export namespace GanacheCommands {
  // Command to bind to UI commands
  export async function startGanacheCmd(
    consortiumTreeManager: ConsortiumTreeManager,
    viewItem?: ConsortiumView): Promise<void> {
    Telemetry.sendEvent('GanacheCommands.startGanacheCmd.commandStarted');

    if (!await required.checkApps(RequiredApps.node)) {
      Telemetry.sendEvent('GanacheCommands.startGanacheCmd.nodeIsNotInstalled');
      commands.executeCommand('azureBlockchainService.showRequirementsPage');
      return;
    }

    const port = await getGanachePort(consortiumTreeManager, viewItem);

    const ganacheProcess = await GanacheService.startGanacheServer(port);

    if (!ganacheProcess) {
      Telemetry.sendEvent('GanacheCommands.startGanacheCmd.serverAlreadyRunning');
      window.showInformationMessage(Constants.ganacheCommandStrings.serverAlreadyRunning);
      return;
    }

    window.showInformationMessage(Constants.ganacheCommandStrings.serverSuccessfullyStarted);
    Telemetry.sendEvent('GanacheCommands.startGanacheCmd.commandFinished');
  }

  // Command to bind to UI commands
  export async function stopGanacheCmd(
    consortiumTreeManager: ConsortiumTreeManager,
    viewItem?: ConsortiumView): Promise<void> {
    Telemetry.sendEvent('GanacheCommands.stopGanacheCmd.commandStarted');
    const port = await getGanachePort(consortiumTreeManager, viewItem);

    if (await isGanacheServer(port)) {
      Telemetry.sendEvent('GanacheCommands.stopGanacheCmd.isGanacheServer');
      await GanacheService.stopGanacheServer(port);
      window.showInformationMessage(Constants.ganacheCommandStrings.serverSuccessfullyStopped);
    } else {
      Telemetry.sendEvent('GanacheCommands.stopGanacheCmd.noGanacheServer');
      window.showWarningMessage(Constants.ganacheCommandStrings.serverCanNotStop);
    }
    Output.show();
    Telemetry.sendEvent('GanacheCommands.stopGanacheCmd.commandFinished');
  }

  export async function getGanachePort(
    consortiumTreeManager: ConsortiumTreeManager,
    viewItem?: ConsortiumView,
  ): Promise<number | string> {
    if (viewItem && viewItem.extensionItem instanceof LocalNetworkConsortium) {
      return await viewItem.extensionItem.getPort() || '';
    } else {
      const hosts = consortiumTreeManager.getItem(ItemType.LOCAL_NETWORK);

      if (!hosts || !hosts.getChildren()) {
        const error = new Error(Constants.ganacheCommandStrings.serverNoGanacheAvailable);
        Telemetry.sendException(error);
        throw error;
      }

      const options = hosts.getChildren();
      const pick = await showQuickPick(
        options as QuickPickItem[],
        { placeHolder: Constants.placeholders.selectGanacheServer, ignoreFocusOut: true });
      return await (pick as LocalNetworkConsortium).getPort() || '';
    }
  }
}
