// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Nullable} from '../Models/TreeItems/Nullable';
import {ExtensionView} from './ExtensionView';

export class NullableView extends ExtensionView<Nullable> {
  constructor(nullableItem: Nullable) {
    super(nullableItem);
  }
}
