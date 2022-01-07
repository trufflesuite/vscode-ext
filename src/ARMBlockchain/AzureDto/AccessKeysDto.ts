// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

export interface IAzureMemberAccessKeysDto {
  keys: [
    {
      keyName: string;
      value: string;
    }
  ];
}
