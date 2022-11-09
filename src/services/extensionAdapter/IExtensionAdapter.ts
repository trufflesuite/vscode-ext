// Copyright (c) 2022. Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {AbstractWorkspace, WorkspaceType} from '@/helpers/AbstractWorkspace';
import {Uri} from 'vscode';

export interface IExtensionAdapter {
  extensionType: WorkspaceType;
  validateExtension: () => Promise<void>;

  build: (workspace: AbstractWorkspace, contractUri?: Uri) => Promise<void>;
  deploy: (workspace: AbstractWorkspace, contractUri?: Uri) => Promise<void>;
}
