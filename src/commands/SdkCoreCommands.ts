// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Memento, window, Uri} from "vscode";
import {Constants} from "../Constants";
import {
  // getWorkspaceRoot,
  // outputCommandHelper,
  // showNotificationConfirmationDialog,
  userSettings,
} from "../helpers";
import {IExtensionAdapter, TruffleExtensionAdapter} from "../services/extensionAdapter";

class SdkCoreCommands {
  // @ts-ignore
  private globalState?: Memento;
  private extensionAdapter!: IExtensionAdapter;

  public async initialize(globalState: Memento): Promise<void> {
    this.globalState = globalState;

    const sdk = await this.getCoreSdk();
    this.extensionAdapter = this.getExtensionAdapter(sdk.userValue ? sdk.userValue : sdk.defaultValue);
    this.extensionAdapter.validateExtension().catch((error) => {
      window.showErrorMessage(error.message);
    });
  }

  /**
   *  call build on an extension
   * @param args an array of compile/build time args you want to pass to the task (optional)
   */
  public async build(...args: Array<string>): Promise<void> {
    return this.extensionAdapter.build(...args);
  }

  public async deploy(): Promise<void> {
    return this.extensionAdapter.deploy();
  }

  public async execScript(uri: Uri): Promise<void> {
    return this.extensionAdapter.execScript(uri);
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
