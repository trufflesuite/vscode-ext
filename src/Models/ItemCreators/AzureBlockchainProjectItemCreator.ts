// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { AzureBlockchainProject } from '../TreeItems';
import { ItemCreator } from './ItemCreator';

export class AzureBlockchainProjectItemCreator extends ItemCreator {
  protected getRequiredFields(): Array<{ fieldName: string, type: string }> {
    const requiredFields = super.getRequiredFields();
    requiredFields.push(...[
      { fieldName: 'label', type: 'string' },
      { fieldName: 'subscriptionId', type: 'string' },
      { fieldName: 'resourceGroup', type: 'string' },
      { fieldName: 'memberName', type: 'string' },
    ]);

    return requiredFields;
  }

  protected getAdditionalConstructorArguments(obj: { [key: string]: any }): any[] {
    return [
      obj.label,
      obj.subscriptionId,
      obj.resourceGroup,
      obj.memberName,
    ];
  }

  protected createFromObject(label: string, subscriptionId: string, resourceGroup: string, memberName: string)
    : AzureBlockchainProject {
    return new AzureBlockchainProject(label, subscriptionId, resourceGroup, memberName);
  }
}
