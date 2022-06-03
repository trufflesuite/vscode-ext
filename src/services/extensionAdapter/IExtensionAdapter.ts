// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.
import {Uri} from "vscode";

export interface IExtensionAdapter {
  validateExtension: () => Promise<void>;
  build: (...args: Array<string>) => Promise<void>;
  deploy: () => Promise<void>;

  execScript: (uri: Uri) => Promise<void>;
}
