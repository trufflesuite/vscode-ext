// Copyright (c) 2022. Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {AbstractWorkspace, WorkspaceType} from '@/helpers/AbstractWorkspace';
import {Uri} from 'vscode';
import {IExtensionAdapter} from './IExtensionAdapter';

export class UnknownExtensionAdapter implements IExtensionAdapter {
  public validateExtension = async (): Promise<void> => {
    // throw new Error("Method not implemented.");
  };

  public build = async (_: AbstractWorkspace, __?: Uri): Promise<void> => {
    // TODO:throw some info here?
  };

  public deploy = async (_: AbstractWorkspace): Promise<void> => {
    // TODO:throw some info here?
  };

  extensionType: WorkspaceType = WorkspaceType.UNKNOWN;
}
