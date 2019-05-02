// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Member } from '../../Models';
import { MemberView } from '../MemberView';
import { ViewCreator } from './ViewCreator';

export class MemberViewCreator extends ViewCreator {
  public create(memberItem: Member): MemberView {
    return new MemberView(memberItem);
  }
}
