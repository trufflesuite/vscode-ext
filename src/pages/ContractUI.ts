// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ExtensionContext } from 'vscode';
import { Constants } from '../Constants';
import { ContractDB } from '../services';
import { BasicWebView, IWebViewConfig } from './BasicWebView';

export class ContractUI extends BasicWebView {
  protected readonly config: IWebViewConfig;
  protected readonly contractName: string;
  private readonly _onChangeContract: (...args: any) => void;
  private pending: boolean;
  private documentReady: boolean;

  constructor(context: ExtensionContext, contractName: string) {
    super(context);
    this.config = Object.assign({}, Constants.webViewPages.contractUI);
    this.config.title += ` - ${contractName}`;
    this.contractName = contractName;
    this._onChangeContract = this.onChangeContract.bind(this);
    this.documentReady = false;
    this.pending = false;

    ContractDB.bus.on('updateContracts', this._onChangeContract);
  }

  protected async createAndShow(): Promise<void> {
    await super.createAndShow();
    await this.updateContract();
  }

  protected async setShowOnStartupFlagAtFirstTime(): Promise<boolean> {
    return false;
  }

  protected async receiveMessage(message: {[key: string]: any}): Promise<void> {
    await super.receiveMessage(message);

    if (!this.panel) {
      return;
    }

    if (message.command === 'documentReady') {
      this.documentReady = true;
      if (this.pending) {
        this.updateContract();
      }
    }
  }

  protected dispose(): void {
    super.dispose();
    ContractDB.bus.off('updateContracts', this._onChangeContract);
  }

  private async updateContract(): Promise<void> {
    if (this.documentReady === false) {
      this.pending = true;
      return;
    }
    const contractHistory = await ContractDB.getContractInstances(this.contractName);
    await this.postMessage({ command: 'contracts', value: contractHistory });
  }

  private async onChangeContract(contractNames: string[]): Promise<void> {
    const index = contractNames.findIndex((contractName) => contractName === this.contractName);
    if (index !== -1) {
      await this.updateContract();
    }
  }
}
