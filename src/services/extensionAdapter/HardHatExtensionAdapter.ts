// Copyright (c) 2022. Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {IExtensionAdapter} from '@/services/extensionAdapter/IExtensionAdapter';
import {Uri} from 'vscode';

export class HardHatExtensionAdapter implements IExtensionAdapter {
  async build(uri: Uri): Promise<void> {
    console.log(`build: `, {uri});
    return undefined;
  }

  async deploy(uri: Uri): Promise<void> {
    console.log(`deploy: `, {uri});
    return Promise.resolve(undefined);
  }

  async validateExtension(): Promise<void> {
    console.log(`validateExtension: `);
    return Promise.resolve(undefined);
  }
}
