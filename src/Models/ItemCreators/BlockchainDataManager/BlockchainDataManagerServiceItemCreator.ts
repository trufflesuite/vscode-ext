// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { BlockchainDataManagerService } from '../../TreeItems';
import { ItemCreator } from '../ItemCreator';

export class BlockchainDataManagerServiceItemCreator extends ItemCreator {
  protected createFromObject(): BlockchainDataManagerService {
    return new BlockchainDataManagerService();
  }
}
