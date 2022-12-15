// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {INetwork} from '@/helpers/ConfigurationReader';
import {ItemType} from './ItemType';
import {TLocalProjectOptions} from './TreeItems/LocalProject';

export interface IDeployDestination {
  description?: string;
  detail?: string;
  label: string;
  networkType: ItemType;
  port?: number;
  getTruffleNetwork: () => Promise<INetwork>;
  networkId: number;
  options?: TLocalProjectOptions;
}
