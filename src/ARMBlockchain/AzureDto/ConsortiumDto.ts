export interface IAzureConsortiumDto {
  protocol: string;
  validatorNodesSku: {
    capacity: number;
  };
  provisioningState: string;
  dns: string;
  userName: string;
  password: string;
  consortium: string;
  consortiumManagementAccountAddress: string;
  consortiumManagementAccountPassword: string;
  rootContractAddress: string;
  publicKey: string;
}
