// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Constants } from '../../../Constants';
import { IDeployDestination } from '../../IDeployDestination';
import { ItemType } from '../../ItemType';
import { Project } from '../Project';

export class BlockchainDataManagerProject extends Project {
  public readonly subscriptionId: string;
  public readonly resourceGroup: string;

  constructor(label: string, subscriptionId: string, resourceGroup: string) {
    super(
      ItemType.BLOCKCHAIN_DATA_MANAGER_PROJECT,
      label,
      Constants.treeItemData.project.bdm,
    );

    this.subscriptionId = subscriptionId;
    this.resourceGroup = resourceGroup;
  }

  public toJSON(): { [p: string]: any } {
    const obj = super.toJSON();

    obj.subscriptionId = this.subscriptionId;
    obj.resourceGroup = this.resourceGroup;

    return obj;
  }

  public getDeployDestinations(): Promise<IDeployDestination[]> {
    throw new Error('Method not implemented.');
  }
}
