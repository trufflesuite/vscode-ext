// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { URL } from 'url';
import { Constants } from '../Constants';
import { TruffleConfiguration } from '../helpers';
import { ExtensionItem } from './ExtensionItem';
import { ItemType } from './ItemType';

const protocolRegExp = new RegExp('^(' +
  Constants.networkProtocols.http + '|' +
  Constants.networkProtocols.https + '|' +
  Constants.networkProtocols.ftp + '|' +
  Constants.networkProtocols.file  +
  ').*', 'i');

export abstract class Consortium extends ExtensionItem {
  private readonly urls: URL[];
  private consortiumId: number;

  protected constructor(itemType: ItemType, consortiumName: string, description?: string) {
    super(itemType, consortiumName, description);

    this.contextValue = Constants.contextValue.consortium;
    this.iconPath = Constants.icons.consortium;

    this.urls = [];
    this.consortiumId = + Date.now();
  }

  public addUrl(url: URL | string) {
    if (typeof url === 'string') {
      if (!url.match(protocolRegExp)) {
         url = `${this.defaultProtocol()}${url}`;
      }

      url = new URL(url);
    }

    this.urls.push(url);
  }

  public addUrls(urls: URL[] | string[]) {
    urls.forEach((url: URL | string) => this.addUrl(url));
  }

  public getUrls(): URL[] {
    return this.urls;
  }

  public toJSON(): { [key: string]: any } {
    const obj = super.toJSON();
    obj.urls = this.urls.map((url) => url.toString());
    obj.consortiumId = this.consortiumId;
    return obj;
  }

  public async getRPCAddress(): Promise<string> {
    return this.urls.length === 0 ? '' : this.urls[0].origin;
  }

  public async getAccessKey(): Promise<string> {
    if (this.urls.length === 0) {
      return '';
    }

    const url = this.urls[0];
    return url.pathname === '/' ? '' : url.pathname || '';
  }

  public getConsortiumId(): number {
    return this.consortiumId;
  }

  public setConsortiumId(id: number): void {
    this.consortiumId = id;
  }

  public async getTruffleNetwork(): Promise<TruffleConfiguration.INetwork> {
    return {
      name: this.label,
      options: {
        consortium_id: this.getConsortiumId(),
        network_id: '*',
      },
    };
  }

  protected defaultProtocol(): string {
    return Constants.networkProtocols.https;
  }
}
