// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {URL} from 'url';
import {Constants} from '../../Constants';
import {TruffleConfiguration} from '../../helpers';
import {ItemType} from '../ItemType';
import {NetworkNode} from './NetworkNode';

export class GenericNetworkNode extends NetworkNode {
  public readonly port: number;

  constructor(label: string, url: URL | string, networkId: number | string) {
    super(ItemType.GENERIC_NETWORK_NODE, label, Constants.treeItemData.network.generic, url, networkId);

    this.port = parseInt(this.url.port, 10) || Constants.defaultLocalhostPort;
  }

  public async getTruffleNetwork(): Promise<TruffleConfiguration.INetwork> {
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
