// Copyright (c) 2022. Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {TruffleCommands} from '@/commands';
import {AbstractWorkspaceManager} from '@/helpers/workspace';
import {Uri} from 'vscode';
import {IExtensionAdapter} from './IExtensionAdapter';
import WorkspaceType = AbstractWorkspaceManager.WorkspaceType;

export class TruffleExtensionAdapter implements IExtensionAdapter {
  public validateExtension = async (): Promise<void> => {
    // throw new Error("Method not implemented.");
  };

  public build = async (_?: AbstractWorkspaceManager.AbstractWorkspace, contractUri?: Uri): Promise<void> => {
    // TODO: rework this code to work with the workspace details.
    return TruffleCommands.buildContracts(contractUri);
  };

  public deploy = async (uri?: Uri): Promise<void> => {
    return TruffleCommands.deployContracts(uri);
  };

  extensionType: AbstractWorkspaceManager.WorkspaceType = WorkspaceType.TRUFFLE;
}
