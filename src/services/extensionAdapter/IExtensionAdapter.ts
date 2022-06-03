// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.
import {Uri} from "vscode";

export interface IExtensionAdapter {
  validateExtension: () => Promise<void>;
  build: (uri: Uri) => Promise<void>;
  deploy: (uri: Uri) => Promise<void>;
}
