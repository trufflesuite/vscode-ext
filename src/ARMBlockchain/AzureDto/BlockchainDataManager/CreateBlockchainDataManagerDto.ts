// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

export interface ICreateBlockchainDataManagerDto {
  location: string;
  properties: {
    sku: string;
    state: string;
  };
}
