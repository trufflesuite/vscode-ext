// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

export interface IGetStorageAccountDto {
  signedServices: string;
  signedResourceTypes: string;
  signedPermission: string;
  signedProtocol: string;
  signedStart: string;
  signedExpiry: string;
  keyToSign: string;
}
