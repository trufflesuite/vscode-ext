// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Constants } from '../../Constants';
import { ItemType } from '../ItemType';
import { Project } from './Project';

export class AzureBlockchainProject extends Project {
  public readonly subscriptionId: string;
  public readonly resourceGroup: string;
  public readonly memberName: string;

  constructor(
    label: string,
    subscriptionId: string,
    resourceGroup: string,
    memberName: string,
  ) {
    super(
      ItemType.AZURE_BLOCKCHAIN_PROJECT,
      label,
      Constants.treeItemData.project.azure,
    );

    this.subscriptionId = subscriptionId;
    this.resourceGroup = resourceGroup;
    this.memberName = memberName;
  }

  public toJSON(): { [p: string]: any } {
    const obj = super.toJSON();

    obj.subscriptionId = this.subscriptionId;
    obj.resourceGroup = this.resourceGroup;
    obj.memberName = this.memberName;

    return obj;
  }
}
