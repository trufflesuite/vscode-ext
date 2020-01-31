// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Constants } from '../../../Constants';
import { ItemType } from '../../ItemType';
import { Service } from '../Service';

export class BlockchainDataManagerService extends Service {
  constructor() {
    super(
      ItemType.BLOCKCHAIN_DATA_MANAGER_SERVICE,
      Constants.treeItemData.service.bdm.label,
      Constants.treeItemData.service.bdm,
    );
  }
}
