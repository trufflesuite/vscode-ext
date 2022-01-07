// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import { ItemType } from "../../ItemType";
import { BlockchainDataManagerNetworkNode } from "../../TreeItems";
import { NetworkNodeItemCreator } from "../NetworkNodeItemCreator";

export class BlockchainDataManagerNetworkNodeItemCreator extends NetworkNodeItemCreator {
  protected getRequiredFields(): Array<{ fieldName: string; type: string }> {
    const requiredFields = super.getRequiredFields();
    requiredFields.push(
      ...[
        { fieldName: "subscriptionId", type: "string" },
        { fieldName: "resourceGroup", type: "string" },
        { fieldName: "fileUrls", type: "array" },
      ]
    );

    return requiredFields;
  }

  protected getAdditionalConstructorArguments(obj: { [key: string]: any }): any[] {
    return [
      ...super.getAdditionalConstructorArguments(obj),
      obj.subscriptionId,
      obj.resourceGroup,
      obj.fileUrls,
      obj.itemType,
    ];
  }

  protected createFromObject(
    label: string,
    url: string,
    networkId: string,
    subscriptionId: string,
    resourceGroup: string,
    fileUrls: string[],
    itemType:
      | ItemType.BLOCKCHAIN_DATA_MANAGER_APPLICATION
      | ItemType.BLOCKCHAIN_DATA_MANAGER_INPUT
      | ItemType.BLOCKCHAIN_DATA_MANAGER_OUTPUT
  ): BlockchainDataManagerNetworkNode {
    return new BlockchainDataManagerNetworkNode(
      label,
      networkId,
      subscriptionId,
      resourceGroup,
      fileUrls,
      itemType,
      url
    );
  }
}
