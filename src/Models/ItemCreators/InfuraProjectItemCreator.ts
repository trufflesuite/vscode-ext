// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {InfuraProject} from "../TreeItems";
import {ItemCreator} from "./ItemCreator";

export class InfuraProjectItemCreator extends ItemCreator {
  protected getRequiredFields(): Array<{fieldName: string; type: string}> {
    const requiredFields = super.getRequiredFields();
    requiredFields.push(
      ...[
        {fieldName: "label", type: "string"},
        {fieldName: "projectId", type: "string"},
      ]
    );

    return requiredFields;
  }

  protected getAdditionalConstructorArguments(obj: {[key: string]: any}): any[] {
    return [obj.label, obj.projectId];
  }

  protected createFromObject(label: string, projectId: string): InfuraProject {
    return new InfuraProject(label, projectId);
  }
}
