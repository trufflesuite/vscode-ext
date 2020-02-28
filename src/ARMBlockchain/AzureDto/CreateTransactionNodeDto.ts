// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

export interface ICreateTransactionNodeDto {
  location: string;
  properties: {
    password: string;
  };
}
