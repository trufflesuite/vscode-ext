// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

export interface IAzureBlockchainDataManagerApplicationDto {
  id: string;
  name: string;
  properties: {
    artifactType: string;
    content: {
      abiFileUrl: string;
      bytecodeFileUrl: string;
      queryTargetTypes: string[];
    };
    state: string;
    provisioningState: string;
    createdTime: string;
    lastUpdatedTime: string;
  };
  type: string;
}
