// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Constants } from '../Constants';
import { TruffleConfiguration } from '../helpers';
import { Consortium } from './Consortium';
import { ItemType } from './ItemType';

export class LocalNetworkConsortium extends Consortium {
  constructor(consortiumName: string, url?: string) {
    super(ItemType.LOCAL_CONSORTIUM, consortiumName);

    if (url) {
      this.addUrl(url);
    }

    this.contextValue = Constants.contextValue.localConsortium;
  }

  public async getTruffleNetwork(): Promise<TruffleConfiguration.INetwork> {
    const network = await super.getTruffleNetwork();

    const url = this.getUrls()[0];
    network.options.host = url.hostname || Constants.localhost;
    network.options.port = parseInt(url.port, 10) || Constants.defaultLocalhostPort;

    return network;
  }

  public async getPort(): Promise<number | undefined> {
    const network = await this.getTruffleNetwork();

    return network.options.port;
  }

  protected defaultProtocol(): string {
    return Constants.networkProtocols.http;
  }
}
