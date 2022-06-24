// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {DashboardService} from "../TreeItems";
import {ItemCreator} from "./ItemCreator";

export class DashboardServiceItemCreator extends ItemCreator {
  protected createFromObject(): DashboardService {
    return new DashboardService();
  }
}
