export interface ICreateQuorumMember {
  region: string;
  consortiumName: string;
  consortiumPassword: string;
  consortiumManagementAccountPassword: string;
  protocol: string;
  sku: {
    name: string;
    tier: string;
  };
}

export class ConsortiumMapper {
  public static getBodyForCreateQuorumMember(params: ICreateQuorumMember): object {
    return {
      location: params.region,
      properties: {
        consortium: params.consortiumName,
        consortiumManagementAccountPassword: params.consortiumManagementAccountPassword,
        password: params.consortiumPassword,
        protocol: params.protocol,
      },
      sku: params.sku,
    };
  }
}
