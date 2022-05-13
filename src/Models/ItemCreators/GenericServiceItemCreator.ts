// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {GenericService} from "../TreeItems";
import {ItemCreator} from "./ItemCreator";

export class GenericServiceItemCreator extends ItemCreator {
  protected createFromObject(): GenericService {
    return new GenericService();
  }
}
