// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Constants} from '../Constants';
import {ItemType} from '../Models';

export function mapItemType(itemType: ItemType) {
  switch (itemType) {
    case ItemType.LOCAL_PROJECT:
      return Constants.treeItemData.service.local.prefix;
    case ItemType.INFURA_PROJECT:
      return Constants.treeItemData.service.infura.prefix;
    default:
      return 'other';
  }
}

export function mapNetworkName(networkName: string) {
  const prefix = networkName
    .replace(new RegExp(`(${Constants.treeItemData.service.infura.prefix})_(.*)`), '$1')
    .replace(new RegExp(`(${Constants.treeItemData.service.local.prefix})_(.*)`), '$1')
    .replace(new RegExp(`(${Constants.localhostName})_(.*)`), '$1');
  switch (prefix) {
    case Constants.treeItemData.service.local.prefix:
    case Constants.localhostName:
      return Constants.treeItemData.service.local.prefix;
    case Constants.treeItemData.service.infura.prefix:
      return Constants.treeItemData.service.infura.prefix;
    default:
      return 'other';
  }
}
