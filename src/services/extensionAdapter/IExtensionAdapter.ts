// Copyright (c) 2022. Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.
import {AbstractWorkspaceManager} from '@/helpers/workspace';
// Licensed under the MIT license.
import {Uri} from 'vscode';
import WorkspaceType = AbstractWorkspaceManager.WorkspaceType;
import AbstractWorkspace = AbstractWorkspaceManager.AbstractWorkspace;

export interface IExtensionAdapter {
  extensionType: WorkspaceType;
  validateExtension: () => Promise<void>;

  build: (workspace?: AbstractWorkspace, contractUri?: Uri) => Promise<void>;
  deploy: (contractUri?: Uri) => Promise<void>;
}
