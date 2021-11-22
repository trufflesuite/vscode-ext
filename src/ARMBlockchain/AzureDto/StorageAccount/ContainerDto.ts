// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

export interface IContainerDto {
  id: string;
  name: string;
  type: string;
  etag: string;
  properties: {
    publicAccess: string;
    leaseStatus: string;
    leaseState: string;
    lastModifiedTime: string;
    hasImmutabilityPolicy: string;
    hasLegalHold: string;
  };
}
