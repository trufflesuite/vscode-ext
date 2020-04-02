// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

export interface ICreateBlockchainDataManagerApplicationDto {
  properties: {
    artifactType: string,
    content: {
      abiFileUrl: string;
      bytecodeFileUrl: string;
      queryTargetTypes: string[];
    };
  };
}
