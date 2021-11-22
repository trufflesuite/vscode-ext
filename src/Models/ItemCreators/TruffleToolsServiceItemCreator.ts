// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import { TruffleToolsService } from "../TreeItems";
import { ItemCreator } from "./ItemCreator";

export class TruffleToolsServiceItemCreator extends ItemCreator {
  protected createFromObject(): TruffleToolsService {
    return new TruffleToolsService();
  }
}
