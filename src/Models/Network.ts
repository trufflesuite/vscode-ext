// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Constants } from '../Constants';
import { ExtensionItem } from './ExtensionItem';
import { ItemType } from './ItemType';

export class Network extends ExtensionItem {
  constructor(
    networkName: string,
    itemType: ItemType.AZURE_BLOCKCHAIN | ItemType.LOCAL_NETWORK |
              ItemType.ETHEREUM_TEST_NETWORK | ItemType.ETHEREUM_MAIN_NETWORK,
  ) {
    super(itemType, networkName);

    this.contextValue = Constants.contextValue.blockchainService;
    this.iconPath = Constants.icons.blockchainService;
  }
}
