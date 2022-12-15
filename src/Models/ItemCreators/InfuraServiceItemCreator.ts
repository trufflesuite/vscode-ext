// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {InfuraService} from '@/Models/TreeItems/InfuraService';
import {ItemCreator} from './ItemCreator';

export class InfuraServiceItemCreator extends ItemCreator {
  protected createFromObject(): InfuraService {
    return new InfuraService();
  }
}
