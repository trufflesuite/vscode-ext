// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Member } from '../Member';
import { ItemCreator } from './ItemCreator';

export class MemberItemCreator extends ItemCreator {
  protected createFromObject(obj: { [key: string]: any }): Member {
    const { label } = obj;

    return new Member(label);
  }
}
