// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {IInfuraProjectDto} from "./IInfuraProjectDto";

export interface IProjectsResultDto {
  allowed_projects: number;
  projects: IInfuraProjectDto[];
}
