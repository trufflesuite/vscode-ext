// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

export interface ICreateBlockchainDataManagerInputDto {
  properties: {
    dataSource: {
      enableBackfilling: string;
      resourceId: string;
    };
    inputType: string;
  };
}
