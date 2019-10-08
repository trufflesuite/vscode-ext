// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { LocalProject } from '../TreeItems';
import { ItemCreator } from './ItemCreator';

export class LocalProjectItemCreator extends ItemCreator {
  protected getRequiredFields(): Array<{ fieldName: string, type: string }> {
    const requiredFields = super.getRequiredFields();
    requiredFields.push(...[
      { fieldName: 'label', type: 'string' },
      { fieldName: 'port', type: 'number' },
    ]);

    return requiredFields;
  }

  protected getAdditionalConstructorArguments(obj: { [key: string]: any }): any[] {
    return [
      obj.label,
      obj.port,
    ];
  }

  protected createFromObject(label: string, port: number): LocalProject {
    return new LocalProject(label, port);
  }
}
