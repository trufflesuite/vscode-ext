// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.
import {Uri} from 'vscode';

export interface IExtensionAdapter {
  validateExtension: () => Promise<void>;

  build: (contractUri?: Uri) => Promise<void>;
  deploy: (contractUri?: Uri) => Promise<void>;
}
