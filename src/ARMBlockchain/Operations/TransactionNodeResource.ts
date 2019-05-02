// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { IAzureTransactionNodeDto } from '..';
import { AzureBlockchainServiceClient } from '../AzureBlockchainServiceClient';

export class TransactionNodeResource {
  constructor(public readonly client: AzureBlockchainServiceClient) {}

  public getListTransactionNode(memberName: string): Promise<IAzureTransactionNodeDto[]> {
    return new Promise((resolve, reject) => {
      return this.client.getTransactionNodes(memberName, (error: Error | null, result?: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(Object.assign([], result.value));
        }
      });
    });
  }
}
