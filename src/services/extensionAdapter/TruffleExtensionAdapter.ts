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

  public build = async (_: AbstractWorkspace, contractUri?: Uri): Promise<void> => {
    return TruffleCommands.buildContracts(contractUri);
  };

  public deploy = async (_: AbstractWorkspace): Promise<void> => {
    return TruffleCommands.deployContracts();
  };

  extensionType: WorkspaceType = WorkspaceType.TRUFFLE;
}
