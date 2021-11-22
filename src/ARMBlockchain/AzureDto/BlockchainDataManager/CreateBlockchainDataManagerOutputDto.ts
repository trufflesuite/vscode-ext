// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

export interface ICreateBlockchainDataManagerOutputDto {
  properties: {
    dataSource: {
      resourceId: string;
    };
    outputType: string;
  };
}
