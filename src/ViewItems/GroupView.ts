// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Group } from '../Models/TreeItems/Group';
import { ExtensionView } from './ExtensionView';

export class GroupView extends ExtensionView<Group> {
  constructor(groupItem: Group) {
    super(groupItem);
  }
}
