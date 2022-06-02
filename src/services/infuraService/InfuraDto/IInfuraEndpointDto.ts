// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

export interface IInfuraEndpointDto {
  [key: string]: {
    https: string;
    wss: string;
    layer?: number;
  };
}
