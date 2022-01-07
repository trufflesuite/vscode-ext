// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import { IAzureConsortiumMemberDto } from "..";
import { AzureBlockchainServiceClient } from "../AzureBlockchainServiceClient";

export class MemberResource {
  constructor(private readonly client: AzureBlockchainServiceClient) {}

  public getMemberList(memberName: string): Promise<IAzureConsortiumMemberDto[]> {
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

  public async checkExistence(name: string): Promise<{
    message: string | null;
    nameAvailable: boolean;
    reason: string;
  }> {
    return await this.client.checkExistence(name, "Microsoft.Blockchain/blockchainMembers");
  }
}
