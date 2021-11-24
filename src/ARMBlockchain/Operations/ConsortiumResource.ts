// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import { IAzureConsortiumDto, IAzureMemberDto } from "..";
import { AzureBlockchainServiceClient } from "../AzureBlockchainServiceClient";
import { ConsortiumMapper, ICreateQuorumMember } from "../Mapper/ConsortiumMapper";

export class ConsortiumResource {
  constructor(private readonly client: AzureBlockchainServiceClient) {}

  public createConsortium(memberName: string, bodyParams: ICreateQuorumMember): Promise<void> {
    const body = ConsortiumMapper.getBodyForCreateQuorumMember(bodyParams);

    // TODO: need receive result
    return new Promise((resolve, reject) => {
      return this.client.createConsortium(memberName, JSON.stringify(body), (error: Error | null, result?: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(Object.assign([], result));
        }
      });
    });
  }

  public async checkExistence(name: string): Promise<{
    message: string | null;
    nameAvailable: boolean;
    reason: string;
  }> {
    return this.client.checkExistence(name, "Microsoft.Blockchain/consortiums");
  }

  public async getConsortiaList(): Promise<IAzureConsortiumDto[]> {
    return new Promise((resolve, reject) => {
      return this.client.getConsortia((error: Error | null, result?: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(
            result.value.map((res: IAzureMemberDto) => {
              const azureMember = res.properties;
              azureMember.location = res.location;

              return azureMember;
            })
          );
        }
      });
    });
  }
}
