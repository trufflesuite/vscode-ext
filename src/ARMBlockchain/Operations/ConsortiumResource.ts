// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { IAzureConsortiumDto, IAzureMemberDto } from '..';
import { AzureBlockchainServiceClient } from '../AzureBlockchainServiceClient';
import { ConsortiumMapper, ICreateQuorumMember } from '../Mapper/ConsortiumMapper';

export class ConsortiumResource {
  constructor(private readonly client: AzureBlockchainServiceClient) {}

  public createConsortium(memberName: string, bodyParams: ICreateQuorumMember): Promise<void> {
    const body = ConsortiumMapper.getBodyForCreateQuorumMember(bodyParams);

    // TODO: need receive result
    return this.client.createConsortium(memberName, JSON.stringify(body));
  }

  public async checkExistence(name: string): Promise<{
    message: string | null,
    nameAvailable: boolean,
    reason: string,
  }> {
    return this.client.checkExistence(name, 'Microsoft.Blockchain/consortiums');
  }

  public async getListOfConsortia(): Promise<IAzureConsortiumDto[]> {
    return new Promise((resolve, reject) => {
      return this.client.getConsortia((error: Error | null, result?: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.value.map((res: IAzureMemberDto) => res.properties));
        }
      });
    });
  }
}
