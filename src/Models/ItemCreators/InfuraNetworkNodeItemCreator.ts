// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { InfuraNetworkNode } from '../TreeItems';
import { NetworkNodeItemCreator } from './NetworkNodeItemCreator';

export class InfuraNetworkNodeItemCreator extends NetworkNodeItemCreator {
  protected createFromObject(label: string, url: string, networkId: string): InfuraNetworkNode {
    return new InfuraNetworkNode(label, url, networkId);
  }
}
