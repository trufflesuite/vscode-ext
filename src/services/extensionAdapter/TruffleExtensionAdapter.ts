// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { TruffleCommands } from '../../commands/TruffleCommands';
import { IExtensionAdapter } from './IExtensionAdapter';

export class TruffleExtensionAdapter implements IExtensionAdapter {
  // tslint:disable-next-line:no-empty
  public async validateExtension(): Promise<void> {}

  public async build(): Promise<void> {
    return TruffleCommands.buildContracts();
  }

  public async deploy() {
    return TruffleCommands.deployContracts();
  }
}
