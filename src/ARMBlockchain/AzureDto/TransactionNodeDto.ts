export interface IAzureTransactionNodeDto {
  location: string;
  name: string;
  properties: {
    provisioningState: string;
    dns: string;
    publicKey: string;
    userName: string;
    password: string;
  };
  type: string;
  id: string;
}
