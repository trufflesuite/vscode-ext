// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Constants} from "../../Constants";
import {ItemType} from "../ItemType";
import {Service} from "./Service";

export class QuorumService extends Service {
  constructor() {
    super(ItemType.QUORUM_SERVICE, Constants.treeItemData.service.quorum.label, Constants.treeItemData.service.quorum);
  }
}
