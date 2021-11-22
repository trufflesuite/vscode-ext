// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

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
