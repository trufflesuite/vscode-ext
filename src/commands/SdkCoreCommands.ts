// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Memento, window, Uri} from 'vscode';
import {Constants} from '@/Constants';
import {userSettings} from '../helpers';
import {IExtensionAdapter, TruffleExtensionAdapter} from '@/services/extensionAdapter';

class SdkCoreCommands {
  private extensionAdapter!: IExtensionAdapter;

  public async initialize(_globalState: Memento): Promise<void> {
    const sdk = await this.getCoreSdk();
    this.extensionAdapter = this.getExtensionAdapter(sdk.userValue ? sdk.userValue : sdk.defaultValue);
    this.extensionAdapter.validateExtension().catch((error) => {
      window.showErrorMessage(error.message);
    });
  }

  /**
   * Calls build on an extension
   */
  public async build(uri: Uri): Promise<void> {
    return this.extensionAdapter.build(uri);
  }

  public async deploy(uri: Uri): Promise<void> {
    return this.extensionAdapter.deploy(uri);
  }

  private async getCoreSdk() {
    return userSettings.getConfigurationAsync(Constants.userSettings.coreSdkSettingsKey);
  }

  private getExtensionAdapter(sdk: string): IExtensionAdapter {
    switch (sdk) {
      default:
        return new TruffleExtensionAdapter();
    }
  }
}

export const sdkCoreCommands = new SdkCoreCommands();
