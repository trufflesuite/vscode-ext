// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Constants} from "../../Constants";
import {ItemType} from "../ItemType";
import {Service} from "./Service";

export class InfuraService extends Service {
  constructor() {
    super(ItemType.INFURA_SERVICE, Constants.treeItemData.service.infura.label, Constants.treeItemData.service.infura);
  }
}
