// Copyright (c) 2022. Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Memento, window, Uri} from 'vscode';
import {Constants} from '@/Constants';
import {userSettings} from '../helpers';
import {IExtensionAdapter, TruffleExtensionAdapter, HardHatExtensionAdapter} from '@/services/extensionAdapter';

class SdkCoreCommands {
  public extensionAdapter!: IExtensionAdapter;

  public async initialize(_globalState: Memento): Promise<void> {
    const sdk = await this.getCoreSdk();
    this.extensionAdapter = this.getExtensionAdapter(sdk.userValue ? sdk.userValue : sdk.defaultValue);
    this.extensionAdapter.validateExtension().then(
      (_) => {
        // TODO: some output
        // this.logger.outputLine(`Configuration Initialized. SdkCoreProvider: ${this.extensionAdapter.constructor.name}`);
      },
      (error) => {
        window.showErrorMessage(error.message);
      }
    );
  }

  /**
   * Triggers the build process to compile smart contracts.
   *
   * @param contractUri if provided, it is the `Uri` of the smart contract to be compiled.
   */
  public async build(contractUri?: Uri): Promise<void> {
    return this.extensionAdapter.build(contractUri);
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

  private getExtensionAdapter(sdk: string): IExtensionAdapter {
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
