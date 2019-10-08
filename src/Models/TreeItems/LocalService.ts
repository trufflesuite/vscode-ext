// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Constants } from '../../Constants';
import { ItemType } from '../ItemType';
import { Service } from './Service';

export class LocalService extends Service {
  constructor() {
    super(
      ItemType.LOCAL_SERVICE,
      Constants.treeItemData.service.local.label,
      Constants.treeItemData.service.local,
    );
  }
}
