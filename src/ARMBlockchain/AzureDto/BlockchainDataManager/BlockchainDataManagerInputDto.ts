// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

export interface IAzureBlockchainDataManagerInputDto {
  id: string;
  name: string;
  properties: {
    inputType: string;
    dataSource: {
      resourceId: string;
    };
  };
  type: string;
}
