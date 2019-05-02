// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Constants } from '../Constants';
import { ExtensionItem } from './ExtensionItem';
import { ItemType } from './ItemType';

export class Member extends ExtensionItem {
  constructor(memberName: string) {
    super(ItemType.MEMBER, memberName);

    this.contextValue = Constants.contextValue.member;
    this.iconPath = Constants.icons.member;
  }

  public toJSON(): { [p: string]: any } {
    return super.toJSON();
  }
}
