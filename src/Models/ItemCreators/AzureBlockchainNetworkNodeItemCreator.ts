// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { AzureBlockchainNetworkNode } from '../TreeItems';
import { NetworkNodeItemCreator } from './NetworkNodeItemCreator';

export class AzureBlockchainNetworkNodeItemCreator extends NetworkNodeItemCreator {
  protected getRequiredFields(): Array<{ fieldName: string, type: string }> {
    const requiredFields = super.getRequiredFields();
    requiredFields.push(...[
      { fieldName: 'subscriptionId', type: 'string' },
      { fieldName: 'resourceGroup', type: 'string' },
      { fieldName: 'memberName', type: 'string' },
    ]);

    return requiredFields;
  }

  protected getAdditionalConstructorArguments(obj: { [key: string]: any }): any[] {
    return [
      ...super.getAdditionalConstructorArguments(obj),
      obj.subscriptionId,
      obj.resourceGroup,
      obj.memberName,
    ];
  }

  protected createFromObject(
    label: string,
    url: string,
    networkId: string,
    subscriptionId: string,
    resourceGroup: string,
    memberName: string,
  ): AzureBlockchainNetworkNode {
    return new AzureBlockchainNetworkNode(label, url, networkId, subscriptionId, resourceGroup, memberName);
  }
}
