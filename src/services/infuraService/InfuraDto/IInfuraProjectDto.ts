// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {IInfuraEndpointDto} from "./IInfuraEndpointDto";

export interface IInfuraProjectDto {
  id: string;
  private: string;
  private_only: boolean;
  addresses: [];
  origins: [];
  user_agents: [];
  name: string;
  status: number;
  created: number;
  updated: number;
  endpoints: IInfuraEndpointDto;
}
