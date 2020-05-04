// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as semver from 'semver';
import { commands, Extension, extensions } from 'vscode';
import { Constants } from '../../Constants';
import { IExtensionAdapter } from './IExtensionAdapter';

export class OpenZeppelinExtensionAdapter implements IExtensionAdapter {
  private extensionInfo: any;
  private extension: Extension<any> | undefined;

  constructor() {
    this.extensionInfo = Constants.externalExtensions[Constants.coreSdk.openZeppelin];
    this.extension = extensions.getExtension(this.extensionInfo.name);
  }

  public async validateExtension(): Promise<void> {
    if (!this.extension) {
      throw new Error(Constants.errorMessageStrings.ExtensionNotInstalled(this.extensionInfo.name));
    }

    const version = this.extension.packageJSON.version;
    if (!semver.eq(version, this.extensionInfo.supportedVersion)) {
      throw new Error(Constants.informationMessage.unsupportedVersionOfExternalExtension(
        this.extensionInfo.name, version, this.extensionInfo.supportedVersion));
    }

    if (!this.extension.isActive) {
      await this.extension.activate();
    }
  }

  public async build(): Promise<void> {
    return commands.executeCommand(this.extensionInfo.commands.buildContracts);
  }

  public async deploy(): Promise<void> {
    return commands.executeCommand(this.extensionInfo.commands.deployContracts);
  }
}
