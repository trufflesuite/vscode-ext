// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import { Constants } from "../../Constants";
import { ItemType } from "../ItemType";
import { Group } from "./Group";

export class Member extends Group {
  constructor(label: string) {
    super(ItemType.MEMBER, label, Constants.treeItemData.group.azure.member);
  }
}
