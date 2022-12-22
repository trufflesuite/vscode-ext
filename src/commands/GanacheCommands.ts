// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {commands, type QuickPickItem, window} from 'vscode';
import {Constants, RequiredApps} from '../Constants';
import {required} from '../helpers/required';
import {showQuickPick} from '../helpers/userInteraction';
import {ItemType} from '@/Models/ItemType';
import {LocalProject, type TLocalProjectOptions} from '@/Models/TreeItems/LocalProject';
import {GanacheService} from '@/services/ganache/GanacheService';
import {TreeManager} from '@/services/tree/TreeManager';
import {Telemetry} from '@/Telemetry';
import type {ProjectView} from '@/views/NetworksView';

export namespace GanacheCommands {
  /**
   * Represents the configuration options to spawn a new Ganache server.
   */
  export type GanachePortAndOptions = {
    /**
     * The `port` where the Ganache process will be listening to.
     */
    port: number;

    /**
     * Additional `options` such as forking information used by the Ganache process.
     */
    options: TLocalProjectOptions;
  };

  /**
   * Starts a new Ganache server using the `ganacheConfigSelector`.
   * The `ganacheConfigSelector` resolves to the `port` and `options`
   * used to start a new Ganache process.
   * The selector must be lazy since `startGanacheCmd` needs to first check
   * whether some required apps are installed.
   *
   * @param ganacheConfigSelector the selector that resolves to a `port` and `options`.
   * @returns
   */
  export async function startGanacheCmd(ganacheConfigSelector: () => Promise<GanachePortAndOptions>): Promise<void> {
    Telemetry.sendEvent('GanacheCommands.startGanacheCmd.commandStarted');

    if (!(await required.checkApps(RequiredApps.node))) {
      Telemetry.sendEvent('GanacheCommands.startGanacheCmd.nodeIsNotInstalled');
      void commands.executeCommand('truffle-vscode.showRequirementsPage');
      return;
    }

    const {port, options} = await ganacheConfigSelector();

    const ganacheProcess = await GanacheService.startGanacheServer(port, options);

    if (!ganacheProcess.process) {
      Telemetry.sendEvent('GanacheCommands.startGanacheCmd.serverAlreadyRunning');
      void window.showInformationMessage(Constants.ganacheCommandStrings.serverAlreadyRunning);
      return;
    }

    Telemetry.sendEvent('GanacheCommands.startGanacheCmd.commandFinished');
    void window.showInformationMessage(Constants.ganacheCommandStrings.serverSuccessfullyStarted);
  }

  /**
   * Stops a Ganache process.
   * If `projectView` is present, it uses the `port` and `options` from that `projectView`.
   * Otherwise, it displays a `window.showQuickPick` to allow the user
   * to select a Ganache server to stop.
   *
   * @param projectView the tree item from the _Networks_ view to get `port` and `options`, if any.
   * @returns the `port` and `options` used to stop the Ganache process,
   * either from the `projectView` or from the `window.showQuickPick` selection.
   * This is used in the `truffle-vscode.restartGanacheServer` command
   * to display the `window.showQuickPick` only once.
   */
  export async function stopGanacheCmd(projectView?: ProjectView): Promise<GanachePortAndOptions> {
    Telemetry.sendEvent('GanacheCommands.stopGanacheCmd.commandStarted');
    const {port, options} = await selectGanachePortAndOptions(projectView);
    const portStatus = await GanacheService.getPortStatus(port);

    if (portStatus === GanacheService.PortStatus.GANACHE) {
      await GanacheService.stopGanacheServer(port);
      Telemetry.sendEvent('GanacheCommands.stopGanacheCmd.isGanacheServer');
      void window.showInformationMessage(Constants.ganacheCommandStrings.serverSuccessfullyStopped);
    } else if (portStatus === GanacheService.PortStatus.FREE) {
      Telemetry.sendEvent('GanacheCommands.stopGanacheCmd.portIsFree');
      void window.showInformationMessage(Constants.ganacheCommandStrings.serverSuccessfullyStopped);
    } else {
      Telemetry.sendEvent('GanacheCommands.stopGanacheCmd.noGanacheServer');
      void window.showWarningMessage(Constants.ganacheCommandStrings.serverCanNotStop);
    }

    Telemetry.sendEvent('GanacheCommands.stopGanacheCmd.commandFinished');

    return {port, options};
  }

  /**
   * Gets or selects the Ganache port and options that can be used to start or stop a Ganache process.
   * If `projectView` is present, it returns the `port` and `options` from that `projectView`.
   * Otherwise, it displays a `window.showQuickPick` to allow the user
   * to select a Ganache server to start or stop.
   *
   * @param projectView the tree item from the _Networks_ view to get `port` and `options`, if any.
   * @returns a promise that resolves to a `port` and `options`.
   */
  export async function selectGanachePortAndOptions(projectView?: ProjectView): Promise<GanachePortAndOptions> {
    if (projectView && projectView.extensionItem instanceof LocalProject) {
      const {port, options} = projectView.extensionItem;
      return {port, options};
    }

    const hosts = TreeManager.getItem(ItemType.LOCAL_SERVICE);

    if (!hosts || !hosts.getChildren()) {
      const error = new Error(Constants.ganacheCommandStrings.serverNoGanacheAvailable);
      Telemetry.sendException(error);
      throw error;
    }

    const items = hosts.getChildren();
    const pick = await showQuickPick(items as QuickPickItem[], {
      placeHolder: Constants.placeholders.selectGanacheServer,
      ignoreFocusOut: true,
    });

    const {port, options} = pick as LocalProject;
    return {port, options};
  }
}
