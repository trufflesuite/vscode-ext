// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Constants} from "../Constants";
import {DashboardProject, GenericNetworkNode} from "../Models/TreeItems";

export class DashboardResourceExplorer {
  public async createDashboardProject(projectName: string, port: number): Promise<DashboardProject> {
    const description = `${Constants.networkProtocols.http}${Constants.localhost}:${port}`;
    const project = new DashboardProject(projectName, port, description);
    const url = `${Constants.networkProtocols.http}${Constants.localhost}:${port}/rpc`;
    const networkNode = new GenericNetworkNode(projectName, url, "*");

    project.addChild(networkNode);

    return project;
  }
}
