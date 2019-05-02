// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { TruffleConfiguration } from '../helpers';
import { ItemType } from './ItemType';
import { NetworkConsortium } from './NetworkConsortium';

export class MainNetworkConsortium extends NetworkConsortium {
  constructor(consortiumName: string, url?: string) {
    super(ItemType.ETHEREUM_MAIN_CONSORTIUM, consortiumName);

    if (url) {
      this.addUrl(url);
    }
  }

  public async getTruffleNetwork(): Promise<TruffleConfiguration.INetwork> {
    const network = await super.getTruffleNetwork();

    network.options.network_id = 1;

    return network;
  }
}
