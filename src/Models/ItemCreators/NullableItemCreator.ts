// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Nullable } from '../TreeItems';
import { ItemCreator } from './ItemCreator';

export class NullableItemCreator extends ItemCreator {
  protected createFromObject(): Nullable {
    return new Nullable();
  }
}
