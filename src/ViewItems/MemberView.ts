// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Member } from '../Models';
import { ExtensionView } from './ExtensionView';

export class MemberView extends ExtensionView<Member> {
  constructor(memberItem: Member) {
    super(memberItem);
  }
}
