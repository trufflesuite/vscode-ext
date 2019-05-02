// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { TruffleConfiguration } from '../helpers';
import { ItemType } from './ItemType';
import { NetworkConsortium } from './NetworkConsortium';

export class TestNetworkConsortium extends NetworkConsortium {
  constructor(consortiumName: string, url?: string) {
    super(ItemType.ETHEREUM_TEST_CONSORTIUM, consortiumName);

    if (url) {
      this.addUrl(url);
    }
  }

  public async getTruffleNetwork(): Promise<TruffleConfiguration.INetwork> {
    const network = await super.getTruffleNetwork();
    const targetURL = network.options.provider!.url;

    network.options.network_id = this.getNetworkId(targetURL!);

    return network;
  }

  /**
   * https://ethereum.stackexchange.com/questions/17051/how-to-select-a-network-id-or-is-there-a-list-of-network-ids
   */
  private getNetworkId(host: string): number | string {
    host = host.toLowerCase();
    if (host.includes('ropsten')) {
      return 3;
    } else if (host.includes('rinkeby')) {
      return 4;
    } else if (host.includes('kovan')) {
      return 42;
    } else if (host.includes('goerli')) {
      return 5;
    } else if (host.includes('kotti')) {
      return 6;
    }

    return '*';
  }
}
