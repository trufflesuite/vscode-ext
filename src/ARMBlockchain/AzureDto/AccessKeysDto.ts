// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

export interface IAzureMemberAccessKeysDto {
  keys: [{
    keyName: string;
    value: string
  }];
}
