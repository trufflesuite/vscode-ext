// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {TLocalProjectOptions, LocalProject} from "../TreeItems";
import {ItemCreator} from "./ItemCreator";

export class LocalProjectItemCreator extends ItemCreator {
  protected getRequiredFields(): Array<{fieldName: string; type: string}> {
    const requiredFields = super.getRequiredFields();
    requiredFields.push(
      ...[
        {fieldName: "label", type: "string"},
        {fieldName: "port", type: "number"},
      ]
    );

    return requiredFields;
  }

  protected getAdditionalConstructorArguments(obj: {[key: string]: any}): any[] {
    return [obj.label, obj.port, obj.options, obj.description];
  }

  protected createFromObject(
    label: string,
    port: number,
    options?: TLocalProjectOptions,
    description?: string
  ): LocalProject {
    return new LocalProject(label, port, options, description);
  }
}
