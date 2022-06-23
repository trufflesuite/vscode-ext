// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {IInfuraProjectDto} from ".";

export interface IInfuraProjectQuickPick extends IInfuraProjectDto {
  label: string;
  picked: boolean;
}
