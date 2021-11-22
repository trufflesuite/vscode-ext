// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import { Memento, window } from "vscode";
import { Constants } from "../Constants";
import {
  // getWorkspaceRoot,
  // outputCommandHelper,
  // showNotificationConfirmationDialog,
  userSettings,
} from "../helpers";
import { IExtensionAdapter, OpenZeppelinExtensionAdapter, TruffleExtensionAdapter } from "../services/extensionAdapter";

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

  public async build(): Promise<void> {
    // await this.notifyAboutOpenZeppelinSdk();
    return this.extensionAdapter.build();
  }

  public async deploy(): Promise<void> {
    // await this.notifyAboutOpenZeppelinSdk();
    return this.extensionAdapter.deploy();
  }

  private async getCoreSdk() {
    return userSettings.getConfigurationAsync(Constants.userSettings.coreSdkSettingsKey);
  }

  private getExtensionAdapter(sdk: string): IExtensionAdapter {
    switch (sdk) {
      case Constants.coreSdk.openZeppelin:
        return new OpenZeppelinExtensionAdapter();
      default:
        return new TruffleExtensionAdapter();
    }
  }

  // TODO: uncomment this once openzeppelin extension is ready
  /* private async notifyAboutOpenZeppelinSdk() {
    const isNotified = this.globalState!.get(Constants.globalStateKeys.isNotifiedAboutOZSdk);

    if (!isNotified) {
      const sdk = await this.getCoreSdk();
      if (sdk.userValue !== Constants.coreSdk.openZeppelin) {
        const answer = await showNotificationConfirmationDialog(
          Constants.informationMessage.ozFrameworkIsAvailableNow,
          Constants.installationDialogResult.install,
          Constants.installationDialogResult.cancel);
        if (answer) {
          await outputCommandHelper.executeCommand(
            getWorkspaceRoot(true),
            `code --install-extension ${Constants.externalExtensions.openZeppelin.name}@'+
            `${Constants.externalExtensions.openZeppelin.supportedVersion}`);
          await userSettings.updateConfigurationAsync(
            Constants.userSettings.coreSdkSettingsKey,
            Constants.coreSdk.openZeppelin);
        }
      }

      await this.globalState!.update(Constants.globalStateKeys.isNotifiedAboutOZSdk, true);
      await this.initialize(this.globalState!);
    }
  } */
}

export const sdkCoreCommands = new SdkCoreCommands();
