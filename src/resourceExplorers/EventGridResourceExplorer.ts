// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { EventGridManagementClient } from '../ARMBlockchain/EventGridManagementClient';
import { Constants } from '../Constants';
import { EventGridItem } from '../Models/QuickPickItems';
import { AzureResourceExplorer } from './AzureResourceExplorer';

export class EventGridResourceExplorer extends AzureResourceExplorer {
  public async loadEventGridItems(eventGridClient: EventGridManagementClient): Promise<EventGridItem[]> {
    try {
      const eventGrids = await eventGridClient.eventGridResource.getEventGridList();

      return eventGrids
        .filter((eg) => eg.properties.provisioningState === Constants.provisioningState.succeeded)
        .map((eg) => new EventGridItem(eg.name, eg.id));
    } catch (e) {
      return [];
    }
  }
}
