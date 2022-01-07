// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import { BlockchainDataManagerProject } from "../../TreeItems";
import { ItemCreator } from "../ItemCreator";

export class BlockchainDataManagerProjectItemCreator extends ItemCreator {
  protected getRequiredFields(): Array<{ fieldName: string; type: string }> {
    const requiredFields = super.getRequiredFields();
    requiredFields.push(
      ...[
        { fieldName: "label", type: "string" },
        { fieldName: "subscriptionId", type: "string" },
        { fieldName: "resourceGroup", type: "string" },
      ]
    );

    return requiredFields;
  }

  protected getAdditionalConstructorArguments(obj: { [key: string]: any }): any[] {
    return [obj.label, obj.subscriptionId, obj.resourceGroup];
  }

  protected createFromObject(
    label: string,
    subscriptionId: string,
    resourceGroup: string
  ): BlockchainDataManagerProject {
    return new BlockchainDataManagerProject(label, subscriptionId, resourceGroup);
  }
}
