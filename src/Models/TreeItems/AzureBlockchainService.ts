// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import { Constants } from "../../Constants";
import { ItemType } from "../ItemType";
import { Service } from "./Service";

export class AzureBlockchainService extends Service {
  constructor() {
    super(
      ItemType.AZURE_BLOCKCHAIN_SERVICE,
      Constants.treeItemData.service.azure.label,
      Constants.treeItemData.service.azure
    );
  }
}
