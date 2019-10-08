// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { AzureBlockchainService } from '../TreeItems';
import { ItemCreator } from './ItemCreator';

export class AzureBlockchainServiceItemCreator extends ItemCreator {
  protected createFromObject(): AzureBlockchainService {
    return new AzureBlockchainService();
  }
}
