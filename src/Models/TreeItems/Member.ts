// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Constants } from '../../Constants';
import { ItemType } from '../ItemType';
import { ExtensionItem } from './ExtensionItem';

export class Member extends ExtensionItem {
  constructor(label: string) {
    super(ItemType.MEMBER, label, Constants.treeItemData.member.azure);
  }
}
