// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {ItemCreator} from "./ItemCreator";

export abstract class NetworkNodeItemCreator extends ItemCreator {
  protected getRequiredFields(): Array<{fieldName: string; type: string}> {
    const requiredFields = super.getRequiredFields();
    requiredFields.push(
      ...[
        {fieldName: "label", type: "string"},
        {fieldName: "url", type: "string"},
        {fieldName: "networkId", type: "string"},
      ]
    );

    return requiredFields;
  }

  protected getAdditionalConstructorArguments(obj: {[key: string]: any}): any[] {
    return [obj.label, obj.url, obj.networkId];
  }
}
