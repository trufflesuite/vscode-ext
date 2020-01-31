// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Group } from '../../Models/TreeItems';
import { GroupView } from '../GroupView';
import { ViewCreator } from './ViewCreator';

export class GroupViewCreator extends ViewCreator {
  public create(groupItem: Group): GroupView {
    return new GroupView(groupItem);
  }
}
