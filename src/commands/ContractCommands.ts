// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {
  commands,
  ExtensionContext,
  StatusBarAlignment,
  StatusBarItem,
  TextDocument,
  Uri,
  window,
  Memento,
} from 'vscode';
import {Constants} from '../Constants';
import {CancellationEvent} from '../Models';
import {ContractUI} from '../pages/ContractUI';
import {ContractDB, ContractService} from '../services';
import {Telemetry} from '../TelemetryClient';
import {TruffleCommands} from './TruffleCommands';

export namespace ContractCommands {
  export class Contract {
    private _globalState: Memento;
    private _statusBar: StatusBarItem;
    private _autoDeployState: boolean;

    constructor(private readonly _context: ExtensionContext) {
      this._globalState = this._context.globalState;
      this._statusBar = window.createStatusBarItem(StatusBarAlignment.Left);
      this._autoDeployState =
        this._globalState.get<boolean>(Constants.globalStateKeys.contractAutoDeployOnSave) || false;
    }

    private async setStatusBarItem(silently: boolean): Promise<void> {
      if (this._autoDeployState) {
        this._statusBar.text = Constants.contract.configuration.statusBar.text.on.label;
        if (!silently) window.showInformationMessage(Constants.contract.configuration.statusBar.text.on.message);
      } else {
        this._statusBar.text = Constants.contract.configuration.statusBar.text.off.label;
        if (!silently) window.showInformationMessage(Constants.contract.configuration.statusBar.text.off.message);
      }
    }

    public async initializeStatusBarItem(): Promise<void> {
      this._statusBar.command = Constants.contract.configuration.statusBar.command;
      this._statusBar.show();

      await this.setStatusBarItem(true);
    }

    public async switchAutoDeployOnOff(silently: boolean): Promise<void> {
      this._autoDeployState = this._autoDeployState ? false : true;

      await this.setStatusBarItem(silently);

      this._globalState.update(Constants.globalStateKeys.contractAutoDeployOnSave, this._autoDeployState);
    }

    public async showSmartContractPage(uri: Uri): Promise<void> {
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

      const contractPage = new ContractUI(this._context, contractName);

      await contractPage.show();
      Telemetry.sendEvent('ContractCommands.showSmartContract.commandFinished');
    }
  }

  export async function autoDeployContracts(context: ExtensionContext, document: TextDocument): Promise<void> {
    const globalState: Memento = context.globalState;
    const contractAutoDeployOnSave = globalState.get<boolean>(Constants.globalStateKeys.contractAutoDeployOnSave);

    if (!contractAutoDeployOnSave) return;

    const file = Uri.parse(document.fileName);
    await TruffleCommands.deployContracts(file);
  }

  export async function deployContractOnSave(context: ExtensionContext): Promise<void> {
    const contract = new ContractCommands.Contract(context);

    await contract.initializeStatusBarItem();

    // Registers the command responsible for disposing the tabs
    context.subscriptions.push(
      commands.registerCommand(Constants.contract.configuration.statusBar.command, async () => {
        await contract.switchAutoDeployOnOff(true);
      })
    );
  }
}
