// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { IAzureMemberDto } from '..';
import { AzureBlockchainServiceClient } from '../AzureBlockchainServiceClient';
import { IAzureMemberAccessKeysDto } from '../AzureDto/AccessKeysDto';

export class MemberResource {
  constructor(public readonly client: AzureBlockchainServiceClient) {}

  public getListMember(): Promise<IAzureMemberDto[]> {
    return new Promise((resolve, reject) => {
      return this.client.getMembers((error: Error | null, result?: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(Object.assign([], result.value));
        }
      });
    });
  }

  public getMemberAccessKeys(memberName: string): Promise<IAzureMemberAccessKeysDto> {
    return new Promise((resolve, reject) => {
      return this.client.getMemberAccessKeys(
        memberName,
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
}
