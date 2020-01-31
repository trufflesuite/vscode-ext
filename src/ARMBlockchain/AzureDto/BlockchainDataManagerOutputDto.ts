// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

export interface IAzureBlockchainDataManagerOutputDto {
  id: string;
  name: string;
  properties: {
    outputType: string;
    dataSource: {
      resourceId: string;
    };
    state: string;
    createdTime: string;
    lastUpdatedTime: string;
  };
  type: string;
}
