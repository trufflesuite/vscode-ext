// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Memento, window, Uri} from 'vscode';
import {Constants} from '@/Constants';
import {getConfigurationAsync} from '@/helpers/userSettings';
import {IExtensionAdapter, TruffleExtensionAdapter} from '@/services/extensionAdapter';

class SdkCoreCommands {
  private extensionAdapter!: IExtensionAdapter;

  public async initialize(_globalState: Memento): Promise<void> {
    const sdk = await this.getCoreSdk();
    this.extensionAdapter = this.getExtensionAdapter(sdk.userValue ? sdk.userValue : sdk.defaultValue);
    this.extensionAdapter.validateExtension().catch((error) => {
      void window.showErrorMessage(error.message);
    });
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
    return getConfigurationAsync(Constants.userSettings.coreSdkSettingsKey);
  }

  private getExtensionAdapter(sdk: string): IExtensionAdapter {
    switch (sdk) {
      default:
        return new TruffleExtensionAdapter();
    }
  }
}

export const sdkCoreCommands = new SdkCoreCommands();
