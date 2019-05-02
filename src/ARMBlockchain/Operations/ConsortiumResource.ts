// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { AzureBlockchainServiceClient } from '../AzureBlockchainServiceClient';
import { ConsortiumMapper, ICreateQuorumMember } from '../Mapper/ConsortiumMapper';

export class ConsortiumResource {
  constructor(public readonly client: AzureBlockchainServiceClient) {}

  public createConsortium(memberName: string, bodyParams: ICreateQuorumMember): Promise<void> {
    const body = ConsortiumMapper.getBodyForCreateQuorumMember(bodyParams);

    // TODO: need receive result
    return this.client.createConsortium(memberName, JSON.stringify(body));
  }
}
