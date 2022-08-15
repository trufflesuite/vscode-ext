// Copyright (c) 2022. Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Constants} from '@/Constants';
import {createOutputInst, OutputLabel} from '@/Output';

import {HardHatExtensionAdapter, IExtensionAdapter, TruffleExtensionAdapter} from '@/services/extensionAdapter';
import {Memento, Uri, window} from 'vscode';
import {userSettings} from '../helpers';

export class SdkCoreCommands {
  public extensionAdapter!: IExtensionAdapter;
  private logger = createOutputInst(OutputLabel.sdkCoreCommands);

  public async initialize(_globalState: Memento): Promise<void> {
    const sdk = userSettings.getConfiguration(Constants.userSettings.coreSdkSettingsKey);
    this.extensionAdapter = SdkCoreCommands.getExtensionAdapter(sdk.userValue ? sdk.userValue : sdk.defaultValue);
    this.extensionAdapter.validateExtension().then(
      (_) => {
        this.logger.outputLine(`Configuration Initialized. SdkCoreProvider: ${this.extensionAdapter.constructor.name}`);
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
