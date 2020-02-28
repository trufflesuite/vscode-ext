// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ISkuDto } from '../..';

export interface IAzureBlockchainDataManagerDto {
  id: string;
  location: string;
  name: string;
  properties: {
    createdTime: string;
    lastUpdatedTime: string;
    provisioningState: string;
    sku: ISkuDto;
    state: string;
    uniqueId: string;
  };
  tags: {};
  type: string;
}
