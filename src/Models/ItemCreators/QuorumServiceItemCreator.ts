// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {QuorumService} from "../TreeItems";
import {ItemCreator} from "./ItemCreator";

export class QuorumServiceItemCreator extends ItemCreator {
  protected createFromObject(): QuorumService {
    return new QuorumService();
  }
}
