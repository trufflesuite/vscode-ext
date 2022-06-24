// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {URL} from "url";
import {Constants} from "../../Constants";
import {TruffleConfiguration} from "../../helpers";
import {ItemType} from "../ItemType";
import {NetworkNode} from "./NetworkNode";

export class DashboardNetworkNode extends NetworkNode {
  public readonly port: number;

  constructor(label: string, url: URL | string, networkId: number | string) {
    super(ItemType.DASHBOARD_NETWORK_NODE, label, Constants.treeItemData.network.dashboard, url, networkId);

    this.port = parseInt(this.url.port, 10) || Constants.dashboardPort;
  }

  public async getTruffleNetwork(): Promise<TruffleConfiguration.INetwork> {
    throw new Error("Method not implemented.");
  }

  protected async getGasPrice(): Promise<number | undefined> {
    return undefined;
  }

  protected async getGasLimit(): Promise<number | undefined> {
    return undefined;
  }

  protected defaultProtocol(): string {
    return Constants.networkProtocols.http;
  }
}
