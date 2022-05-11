// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {QuorumNetworkNode} from "../TreeItems";
import {NetworkNodeItemCreator} from "./NetworkNodeItemCreator";

export class QuorumNetworkNodeItemCreator extends NetworkNodeItemCreator {
  protected createFromObject(label: string, url: string, networkId: string): QuorumNetworkNode {
    return new QuorumNetworkNode(label, url, networkId);
  }
}
