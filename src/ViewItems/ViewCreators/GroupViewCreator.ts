// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Group} from '../../Models/TreeItems/Group';
import {GroupView} from '../GroupView';
import {ViewCreator} from './ViewCreator';

export class GroupViewCreator extends ViewCreator {
  public create(groupItem: Group): GroupView {
    return new GroupView(groupItem);
  }
}
