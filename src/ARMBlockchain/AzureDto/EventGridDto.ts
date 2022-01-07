// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

export interface IEventGridDto {
  properties: {
    provisioningState: string;
    endpoint: string;
    inputSchema: string;
    metricResourceId: string;
  };
  location: string;
  tags: string;
  id: string;
  name: string;
  type: string;
}
