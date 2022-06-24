// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Constants} from "../../Constants";
import {IDeployDestination} from "../IDeployDestination";
import {ItemType} from "../ItemType";
import {Project} from "./Project";

export class DashboardProject extends Project {
  public readonly port: number;

  constructor(label: string, port: number, description?: string) {
    super(ItemType.DASHBOARD_PROJECT, label, Constants.treeItemData.project.dashboard, description);

    this.port = port;
  }

  public toJSON(): {[p: string]: any} {
    const obj = super.toJSON();

    obj.port = this.port;

    return obj;
  }

  public async getDeployDestinations(): Promise<IDeployDestination[]> {
    throw new Error("Method not implemented.");
  }
}
