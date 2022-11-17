// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {TruffleCommands} from '@/commands';
import {AbstractWorkspace, WorkspaceType} from '@/helpers/AbstractWorkspace';
import {Uri} from 'vscode';
import {IExtensionAdapter} from './IExtensionAdapter';

export class TruffleExtensionAdapter implements IExtensionAdapter {
  public validateExtension = async (): Promise<void> => {
    // throw new Error("Method not implemented.");
  };

  public build = async (ws: AbstractWorkspace, contractUri?: Uri): Promise<void> => {
    return TruffleCommands.buildContracts(ws, contractUri);
  };

  public deploy = async (ws: AbstractWorkspace): Promise<void> => {
    return TruffleCommands.deployContracts(ws);
  };

  extensionType: WorkspaceType = WorkspaceType.TRUFFLE;
}
