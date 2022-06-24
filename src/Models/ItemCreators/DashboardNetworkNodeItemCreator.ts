// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {DashboardNetworkNode} from "../TreeItems";
import {NetworkNodeItemCreator} from "./NetworkNodeItemCreator";

export class DashboardNetworkNodeItemCreator extends NetworkNodeItemCreator {
  protected createFromObject(label: string, url: string, networkId: string): DashboardNetworkNode {
    return new DashboardNetworkNode(label, url, networkId);
  }
}
