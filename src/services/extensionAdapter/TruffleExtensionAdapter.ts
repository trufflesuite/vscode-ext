// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import { TruffleCommands } from "../../commands/TruffleCommands";
import { IExtensionAdapter } from "./IExtensionAdapter";

export class TruffleExtensionAdapter implements IExtensionAdapter {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public async validateExtension(): Promise<void> {}

  public async build(): Promise<void> {
    return TruffleCommands.buildContracts();
  }

  public async deploy() {
    return TruffleCommands.deployContracts();
  }
}
