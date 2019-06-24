// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ISkuDto } from '..';
import { AzureBlockchainServiceClient } from '../AzureBlockchainServiceClient';

export class SkuResource {
  constructor(public readonly client: AzureBlockchainServiceClient) {}

  public getListSkus(): Promise<ISkuDto[]> {
    return new Promise((resolve, reject) => {
      return this.client.getSkus((error: Error | null, result?: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(Object.assign([], result.value));
        }
      });
    });
  }
}
