// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

export interface IInfuraEndpointDto {
  [key: string]: {
    https: string;
    wss: string;
  };
}
