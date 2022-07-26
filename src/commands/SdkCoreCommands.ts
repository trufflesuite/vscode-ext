// Copyright (c) 2022. Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Constants} from '@/Constants';
import {HardHatExtensionAdapter, IExtensionAdapter, TruffleExtensionAdapter} from '@/services/extensionAdapter';
import {Memento, Uri, window} from 'vscode';
import {userSettings} from '../helpers';

export class SdkCoreCommands {
  public extensionAdapter!: IExtensionAdapter;

  public async initialize(_globalState: Memento): Promise<void> {
    const sdk = userSettings.getConfiguration(Constants.userSettings.coreSdkSettingsKey);
    this.extensionAdapter = SdkCoreCommands.getExtensionAdapter(sdk.userValue ? sdk.userValue : sdk.defaultValue);
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

  private static getExtensionAdapter(sdk: string): IExtensionAdapter {
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
