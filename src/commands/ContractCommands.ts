// Copyright (c) 2022. Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {StatusBarItems} from '@/Models/StatusBarItems/Contract';
import {commands, ExtensionContext, Uri, window} from 'vscode';
import {Constants} from '../Constants';
import {CancellationEvent} from '../Models';
import {ContractUI} from '../pages/ContractUI';
import {ContractDB, ContractService} from '../services';
import {Telemetry} from '../TelemetryClient';

export namespace ContractCommands {
  /**
   * This function is responsible for enabling or disabling the automatic deployment of contracts
   *
   * @param contractStatusBarItem The object representing the status bar contract item.
   */
  export async function setEnableOrDisableAutoDeploy(contractStatusBarItem: StatusBarItems.Contract): Promise<void> {
    // Gets the current auto deploy current state and invert its value
    const enableOrDisableAutoDeploy = contractStatusBarItem.getState() ? false : true;

    // Set the new state value
    contractStatusBarItem.setState(enableOrDisableAutoDeploy);
  }

  /**
   * @deprecated The method should not be used
   */
  export async function showSmartContractPage(context: ExtensionContext, uri: Uri): Promise<void> {
    Telemetry.sendEvent('ContractCommands.showSmartContract.commandStarted');
    const contractName = ContractService.getContractNameBySolidityFile(uri.fsPath);

    let contractHistory = await ContractDB.getContractInstances(contractName);

    // First attempt
    if (!contractHistory.length) {
      Telemetry.sendEvent('ContractCommands.showSmartContract.needUserAction');
      const result = await window.showWarningMessage(
        Constants.informationMessage.contractNotDeployed,
        Constants.informationMessage.deployButton,
        Constants.informationMessage.cancelButton
      );

      if (result === Constants.informationMessage.deployButton) {
        Telemetry.sendEvent('ContractCommands.showSmartContract.deployContracts');
        await commands.executeCommand('truffle-vscode.deployContracts');
      } else {
        Telemetry.sendEvent('ContractCommands.showSmartContract.userCancellation');
        throw new CancellationEvent();
      }

      contractHistory = await ContractDB.getContractInstances(contractName);
    }

    // Second attempt after deploy
    if (!contractHistory.length) {
      const error = new Error(Constants.errorMessageStrings.CompiledContractIsMissing);
      Telemetry.sendException(error);
      throw error;
    }

    const contractPage = new ContractUI(context, contractName);

    await contractPage.show();
    Telemetry.sendEvent('ContractCommands.showSmartContract.commandFinished');
  }
}
