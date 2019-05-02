// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { AzureConsortium } from '../AzureConsortium';
import { ConsortiumItemCreator } from './ConsortiumItemCreator';

export class AzureConsortiumItemCreator extends ConsortiumItemCreator {
  protected getRequiredFields(): Array<{ fieldName: string, type: string }> {
    const requiredFields = super.getRequiredFields();
    requiredFields.push(...[
      { fieldName: 'subscriptionId', type: 'string' },
      { fieldName: 'resourcesGroup', type: 'string' },
      { fieldName: 'memberName', type: 'string' },
    ]);

    return requiredFields;
  }

  protected getAdditionalConstructorArguments(obj: { [key: string]: any }): any[] {
    const { memberName, resourcesGroup, subscriptionId } = obj;
    return [
      subscriptionId,
      resourcesGroup,
      memberName,
    ];
  }

  protected createConsortium(consortiumName: string, subscriptionId: string, resourcesGroup: string, memberName: string)
    : AzureConsortium {
    return new AzureConsortium(consortiumName, subscriptionId, resourcesGroup, memberName);
  }
}
