// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { commands, QuickPickItem, window } from 'vscode';
import { Constants } from '../Constants';
import { GanacheService } from '../GanacheService/GanacheService';
import { isGanacheServer } from '../GanacheService/GanacheServiceClient';
import { required, showQuickPick } from '../helpers';
import { ItemType, LocalNetworkConsortium } from '../Models';
import { Output } from '../Output';
import { ConsortiumTreeManager } from '../treeService/ConsortiumTreeManager';
import { ConsortiumView } from '../ViewItems';

export namespace GanacheCommands {
  // Command to bind to UI commands
  export async function startGanacheCmd(
    consortiumTreeManager: ConsortiumTreeManager,
    viewItem?: ConsortiumView): Promise<void> {

    if (!await required.checkApps(required.Apps.node)) {
      commands.executeCommand('azureBlockchainService.showRequirementsPage');
      return;
    }

    const port = await getGanachePort(consortiumTreeManager, viewItem);

    const ganacheProcess = await GanacheService.startGanacheServer(port);

    if (!ganacheProcess) {
      window.showInformationMessage(Constants.ganacheCommandStrings.serverAlreadyRunning);
      return;
    }

    window.showInformationMessage(Constants.ganacheCommandStrings.serverSuccessfullyStarted);
  }

  // Command to bind to UI commands
  export async function stopGanacheCmd(
    consortiumTreeManager: ConsortiumTreeManager,
    viewItem?: ConsortiumView): Promise<void> {
    const port = await getGanachePort(consortiumTreeManager, viewItem);

    if (isGanacheServer(port)) {
      await GanacheService.stopGanacheServer(port);
      window.showInformationMessage(Constants.ganacheCommandStrings.serverSuccessfullyStopped);
    } else {
      window.showWarningMessage(Constants.ganacheCommandStrings.serverCanNotStop);
    }
    Output.show();
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
        throw new Error(Constants.ganacheCommandStrings.serverNoGanacheAvailable);
      }

      const options = hosts.getChildren();
      const pick = await showQuickPick(
        options as QuickPickItem[],
        { placeHolder: Constants.placeholders.selectGanacheServer, ignoreFocusOut: true });
      return await (pick as LocalNetworkConsortium).getPort() || '';
    }
  }
}
