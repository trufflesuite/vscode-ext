// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Uri} from "vscode";
import {TruffleCommands} from "../../commands/TruffleCommands";
import {IExtensionAdapter} from "./IExtensionAdapter";

export class TruffleExtensionAdapter implements IExtensionAdapter {
  public validateExtension = async (): Promise<void> => {
    // throw new Error("Method not implemented.");
  };

  public build = async (uri?: Uri): Promise<void> => {
    return TruffleCommands.buildContracts(uri);
  };

  public deploy = async (uri?: Uri): Promise<void> => {
    return TruffleCommands.deployContracts(uri);
  };
}
