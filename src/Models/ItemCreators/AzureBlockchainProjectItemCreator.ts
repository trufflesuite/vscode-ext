// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import { AzureBlockchainProject } from "../TreeItems";
import { ItemCreator } from "./ItemCreator";

export class AzureBlockchainProjectItemCreator extends ItemCreator {
  protected getRequiredFields(): Array<{ fieldName: string; type: string }> {
    const requiredFields = super.getRequiredFields();
    requiredFields.push(
      ...[
        { fieldName: "label", type: "string" },
        { fieldName: "subscriptionId", type: "string" },
        { fieldName: "resourceGroup", type: "string" },
        { fieldName: "memberNames", type: "array" },
      ]
    );

    return requiredFields;
  }

  protected getAdditionalConstructorArguments(obj: { [key: string]: any }): any[] {
    return [obj.label, obj.subscriptionId, obj.resourceGroup, obj.memberNames];
  }

  protected createFromObject(
    label: string,
    subscriptionId: string,
    resourceGroup: string,
    memberNames: string[]
  ): AzureBlockchainProject {
    return new AzureBlockchainProject(label, subscriptionId, resourceGroup, memberNames);
  }
}
