// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {GenericProject} from '../TreeItems';
import {ItemCreator} from './ItemCreator';

export class GenericProjectItemCreator extends ItemCreator {
  protected getRequiredFields(): Array<{fieldName: string; type: string}> {
    const requiredFields = super.getRequiredFields();
    requiredFields.push(
      ...[
        {fieldName: 'label', type: 'string'},
        {fieldName: 'port', type: 'number'},
      ]
    );

    return requiredFields;
  }

  protected getAdditionalConstructorArguments(obj: {[key: string]: any}): any[] {
    return [obj.label, obj.port, obj.description];
  }

  protected createFromObject(label: string, port: number, description?: string): GenericProject {
    return new GenericProject(label, port, description);
  }
}
