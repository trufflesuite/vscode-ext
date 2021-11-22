// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

export interface ICreateStorageAccountDto {
  kind: string;
  location: string;
  sku: {
    name: string;
  };
}
