// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {INetwork} from '@/helpers/ConfigurationReader';
import {URL} from 'url';
import {Constants} from '@/Constants';
import {ItemType} from '@/Models/ItemType';
import {NetworkNode} from './NetworkNode';

export class LocalNetworkNode extends NetworkNode {
  public readonly port: number;

  constructor(label: string, url: URL | string, networkId: number | string) {
    super(ItemType.LOCAL_NETWORK_NODE, label, Constants.treeItemData.network.local, url, networkId);

    this.port = parseInt(this.url.port, 10) || Constants.defaultLocalhostPort;
  }

  public async getTruffleNetwork(): Promise<INetwork> {
    const network = await super.getTruffleNetwork();

    network.options.host = this.url.hostname || Constants.localhost;
    network.options.port = this.port;

    return network;
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
