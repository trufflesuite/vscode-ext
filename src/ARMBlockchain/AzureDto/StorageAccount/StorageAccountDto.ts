// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import { IStorageAccountEncryptionServicesDto } from "./StorageAccountEncryptionServicesDto";

export interface IStorageAccountDto {
  sku: {
    name: string;
    tier: string;
  };
  kind: string;
  id: string;
  name: string;
  type: string;
  location: string;
  tags: {};
  properties: {
    privateEndpointConnections: [];
    networkAcls: {
      bypass: string;
      virtualNetworkRules: [];
      ipRules: [];
      defaultAction: string;
    };
    supportsHttpsTrafficOnly: string;
    encryption: {
      services: {
        dfs?: IStorageAccountEncryptionServicesDto;
        web?: IStorageAccountEncryptionServicesDto;
        blob?: IStorageAccountEncryptionServicesDto;
        queue?: IStorageAccountEncryptionServicesDto;
        table?: IStorageAccountEncryptionServicesDto;
        file?: IStorageAccountEncryptionServicesDto;
      };
      keySource: string;
    };
    accessTier: string;
    provisioningState: string;
    creationTime: string;
    primaryEndpoints: {
      dfs?: string;
      web?: string;
      blob?: string;
      queue?: string;
      table?: string;
      file?: string;
    };
    primaryLocation: string;
    statusOfPrimary: string;
    secondaryLocation: string;
    statusOfSecondary: string;
  };
}
