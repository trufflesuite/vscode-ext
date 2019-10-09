// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { InfuraService } from '../TreeItems';
import { ItemCreator } from './ItemCreator';

export class InfuraServiceItemCreator extends ItemCreator {
  protected createFromObject(): InfuraService {
    return new InfuraService();
  }
}
