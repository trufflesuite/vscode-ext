// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Constants} from '../../Constants';
import {ItemType} from '../ItemType';
import {Service} from './Service';

export class GenericService extends Service {
  constructor() {
    super(
      ItemType.GENERIC_SERVICE,
      Constants.treeItemData.service.generic.label,
      Constants.treeItemData.service.generic
    );
  }
}
