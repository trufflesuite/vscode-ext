// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {GenericNetworkNode} from '../TreeItems';
import {NetworkNodeItemCreator} from './NetworkNodeItemCreator';

export class GenericNetworkNodeItemCreator extends NetworkNodeItemCreator {
  protected createFromObject(label: string, url: string, networkId: string): GenericNetworkNode {
    return new GenericNetworkNode(label, url, networkId);
  }
}
