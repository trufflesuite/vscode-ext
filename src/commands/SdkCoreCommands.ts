// Copyright (c) 2022. Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Constants} from '@/Constants';
import {AbstractWorkspaceManager} from '@/helpers/workspace';
import {Output, OutputLabel} from '@/Output';

import {HardHatExtensionAdapter, IExtensionAdapter, TruffleExtensionAdapter} from '@/services/extensionAdapter';
import {Memento, Uri, window} from 'vscode';
import {userSettings} from '../helpers';

class SdkCoreCommands {
  public extensionAdapter!: IExtensionAdapter;

  private extensionAdapters = new Map<string, IExtensionAdapter>();

  public async initialize(_globalState: Memento): Promise<void> {
    const sdk = await this.getCoreSdk();
    this.getExtensionAdapter(sdk.userValue ? sdk.userValue : sdk.defaultValue);
  }

  private getExtensionAdapter(sdkVal: string): IExtensionAdapter | undefined {
    if (this.extensionAdapters.has(sdkVal)) {
      return this.extensionAdapters.get(sdkVal);
    }
    // let's initialise it otherwise
    const adapter = this.initExtensionAdapter(sdkVal);
    console.log(`getExtensionAdapter: `, {adapter, sdkVal});
    adapter.validateExtension().then(
      (_) => {
        Output.outputLine(
          OutputLabel.sdkCoreCommands,
          `Configuration Initialized. SdkCoreProvider: ${adapter.constructor.name}`
        );
      },
      (error) => {
        window.showErrorMessage(error.message);
      }
    );
    this.extensionAdapters.set(sdkVal, adapter);
    return adapter;
  }

  /**
   * Triggers the build process to compile smart contracts.
   *
   * @param contractUri if provided, it is the `Uri` of the smart contract to be compiled.
   */
  public async build(contractUri?: Uri): Promise<void> {
    const ws = await AbstractWorkspaceManager.getWorkspaceForUri(contractUri);
    const buildUri = contractUri ? contractUri : ws.workspace;
    console.log(`build: `, {contractUri, buildUri, type: ws.workspaceType, ret: ws});
    return this.getExtensionAdapter(ws.workspaceType)!.build(ws, buildUri);
    // return this.extensionAdapter.build(contractUri);
  }

  /**
   * Deploys, _i.e._, `migrate`, smart contracts into a Network.
   *
   * @param contractUri FIXME: Is this used?
   */
  public async deploy(contractUri?: Uri): Promise<void> {
    return this.extensionAdapter.deploy(contractUri);
  }

  private async getCoreSdk() {
    return userSettings.getConfigurationAsync(Constants.userSettings.coreSdkSettingsKey);
  }

  private initExtensionAdapter(sdk: string): IExtensionAdapter {
    switch (sdk) {
      case Constants.coreSdk.hardhat:
        return new HardHatExtensionAdapter();
      case Constants.coreSdk.truffle:
        return new TruffleExtensionAdapter();
      default:
        return new TruffleExtensionAdapter();
    }
  }
}

export const sdkCoreCommands = new SdkCoreCommands();
