// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Uri} from "vscode";
import {TruffleCommands} from "../../commands/TruffleCommands";
import {IExtensionAdapter} from "./IExtensionAdapter";

export class TruffleExtensionAdapter implements IExtensionAdapter {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public async validateExtension(): Promise<void> {}

  public async build(uri?: Uri): Promise<void> {
    return TruffleCommands.buildContracts(uri);
  }

  public async deploy(uri?: Uri) {
    return TruffleCommands.deployContracts(uri);
  }
}
