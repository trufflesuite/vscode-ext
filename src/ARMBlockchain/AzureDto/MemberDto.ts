// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import { IAzureConsortiumDto } from "./ConsortiumDto";

export interface IAzureMemberDto {
  location: string;
  name: string;
  properties: IAzureConsortiumDto;
  type: string;
  id: string;
  tags: {};
}
