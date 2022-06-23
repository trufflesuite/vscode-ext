// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Nullable} from "../../Models/TreeItems";
import {NullableView} from "../NullableView";
import {ViewCreator} from "./ViewCreator";

export class NullableViewCreator extends ViewCreator {
  public create(nullableItem: Nullable): NullableView {
    return new NullableView(nullableItem);
  }
}
