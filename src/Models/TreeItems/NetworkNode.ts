// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { URL } from 'url';
import { Constants } from '../../Constants';
import { TruffleConfiguration } from '../../helpers';
import { ItemType } from '../ItemType';
import { ExtensionItem, ExtensionItemData } from './ExtensionItem';

const protocolRegExp = new RegExp('^(' +
  Constants.networkProtocols.http + '|' +
  Constants.networkProtocols.https + '|' +
  Constants.networkProtocols.ftp + '|' +
  Constants.networkProtocols.file +
  ').*', 'i');

export type NetworkNodeTypes =
  ItemType.AZURE_BLOCKCHAIN_NETWORK_NODE |
  ItemType.LOCAL_NETWORK_NODE |
  ItemType.INFURA_NETWORK_NODE |
  ItemType.BLOCKCHAIN_DATA_MANAGER_APPLICATION |
  ItemType.BLOCKCHAIN_DATA_MANAGER_INPUT |
  ItemType.BLOCKCHAIN_DATA_MANAGER_OUTPUT;

export abstract class NetworkNode extends ExtensionItem {
  public readonly networkId: number | string;
  public readonly url: URL;

  protected constructor(
    itemType: NetworkNodeTypes,
    label: string,
    data: ExtensionItemData,
    url: URL | string,
    networkId: number | string,
  ) {
    networkId = networkId === '*' ? networkId : parseInt(networkId + '', 10);

    super(itemType, label, data);

    this.url = this.prepareUrl(url);
    this.networkId = networkId;
  }

  public toJSON(): { [key: string]: any } {
    const obj = super.toJSON();

    obj.url = this.url.toString();
    obj.networkId = this.networkId.toString();

    return obj;
  }

  public async getRPCAddress(): Promise<string> {
    if (!this.url) {
      return '';
    }

    return this.url.pathname === '/' ? this.url.origin : this.url.href;
  }

  public async getTruffleNetwork(): Promise<TruffleConfiguration.INetwork> {
    return {
      name: this.label,
      options: {
        gasPrice: await this.getGasPrice(),
        network_id: this.networkId,
      },
    };
  }

  protected abstract async getGasPrice(): Promise<number | undefined>;

  protected abstract async getGasLimit(): Promise<number | undefined>;

  protected abstract defaultProtocol(): string;

  private prepareUrl(url: URL | string): URL {
    if (typeof url === 'string') {
      if (!url.match(protocolRegExp)) {
        url = `${this.defaultProtocol()}${url}`;
      }

      url = new URL(url);
    }

    return url;
  }
}
