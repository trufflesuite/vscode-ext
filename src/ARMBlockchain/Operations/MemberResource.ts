// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { IAzureConsortiumMemberDto } from '..';
import { AzureBlockchainServiceClient } from '../AzureBlockchainServiceClient';
import { IAzureMemberAccessKeysDto } from '../AzureDto/AccessKeysDto';

export class MemberResource {
  constructor(private readonly client: AzureBlockchainServiceClient) {}

  public getListMember(memberName: string): Promise<IAzureConsortiumMemberDto[]> {
    return new Promise((resolve, reject) => {
      return this.client.getMembers(memberName, (error: Error | null, result?: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(Object.assign([], result.value));
        }
      });
    });
  }

  public getTransactionNodeAccessKeys(memberName: string, nodeName: string): Promise<IAzureMemberAccessKeysDto> {
    return new Promise((resolve, reject) => {
      return this.client.getTransactionNodeAccessKeys(
        memberName,
        nodeName,
        (error: Error | null, result?: any,
      ) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }

  public async checkExistence(name: string): Promise<{
    message: string | null,
    nameAvailable: boolean,
    reason: string,
  }> {
    return await this.client.checkExistence(name, 'Microsoft.Blockchain/blockchainMembers');
  }
}
