// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {ItemType} from "../ItemType";
import {Layer} from "./Layer";
import {Constants} from "../../Constants";

export class InfuraLayer extends Layer {
  constructor(label: string) {
    super(ItemType.INFURA_LAYER, label, Constants.treeItemData.layer.infura);
  }

  public toJSON(): {[p: string]: any} {
    const obj = super.toJSON();

    return obj;
  }
}
