// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Constants} from "../../Constants";
import {ItemType} from "../ItemType";
import {Service} from "./Service";

export class DashboardService extends Service {
  constructor() {
    super(
      ItemType.DASHBOARD_SERVICE,
      Constants.treeItemData.service.dashboard.label,
      Constants.treeItemData.service.dashboard
    );
  }
}
