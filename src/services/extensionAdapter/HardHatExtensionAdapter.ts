// Copyright (c) 2022. Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {buildContracts} from '@/commands/HardhatCommands';
// import { ext} from '@/Constants';
import {IExtensionAdapter} from '@/services/extensionAdapter/IExtensionAdapter';
import {Uri} from 'vscode';

export class HardHatExtensionAdapter implements IExtensionAdapter {
  async build(uri: Uri): Promise<void> {
    // ext.outputChannel.appendLine(`Building: ${uri?.toString}`);
    return buildContracts(uri);
  }

  async deploy(_uri: Uri): Promise<void> {
    // ext.outputChannel.appendLine(`Deploying: ${uri?.toString}`);
    return Promise.resolve(undefined);
  }

  async validateExtension(): Promise<void> {
    return Promise.resolve(undefined);
  }
}
