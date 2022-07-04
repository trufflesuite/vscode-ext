// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {commands, ExtensionContext, Uri, window} from 'vscode';
import {Constants} from '../Constants';
import {CancellationEvent} from '../Models';
import {ContractUI} from '../pages/ContractUI';
import {ContractDB, ContractService} from '../services';
import {Telemetry} from '../TelemetryClient';

export namespace ContractCommands {
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
