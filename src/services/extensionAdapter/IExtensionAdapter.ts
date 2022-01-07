// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

export interface IExtensionAdapter {
  validateExtension: () => Promise<void>;
  build: () => Promise<void>;
  deploy: () => Promise<void>;
}
