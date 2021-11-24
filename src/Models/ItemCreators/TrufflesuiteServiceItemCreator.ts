// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import { AzureBlockchainService } from "../TreeItems";
import { ItemCreator } from "./ItemCreator";

export class TrufflesuiteServiceItemCreator extends ItemCreator {
  protected createFromObject(): AzureBlockchainService {
    return new AzureBlockchainService();
  }
}
