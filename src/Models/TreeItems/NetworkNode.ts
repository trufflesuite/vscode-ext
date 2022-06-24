// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {URL} from "url";
import {Constants} from "../../Constants";
import {TruffleConfiguration} from "../../helpers";
import {ItemType} from "../ItemType";
import {ExtensionItem, ExtensionItemData} from "./ExtensionItem";

const protocolRegExp = new RegExp(
  "^(" +
    Constants.networkProtocols.http +
    "|" +
    Constants.networkProtocols.https +
    "|" +
    Constants.networkProtocols.ftp +
    "|" +
    Constants.networkProtocols.file +
    ").*",
  "i"
);

export type NetworkNodeTypes =
  | ItemType.LOCAL_NETWORK_NODE
  | ItemType.INFURA_NETWORK_NODE
  | ItemType.GENERIC_NETWORK_NODE;

export abstract class NetworkNode extends ExtensionItem {
  public readonly networkId: number | string;
  public readonly url: URL;

  protected constructor(
    itemType: NetworkNodeTypes,
    label: string,
    data: ExtensionItemData,
    url: URL | string,
    networkId: number | string,
    description?: string
  ) {
    networkId = networkId === "*" ? networkId : parseInt(networkId + "", 10);

    super(itemType, label, data, description);

    this.url = this.prepareUrl(url);
    this.networkId = networkId;
  }

  public toJSON(): {[key: string]: any} {
    const obj = super.toJSON();

    obj.url = this.url.toString();
    obj.networkId = this.networkId.toString();

    return obj;
  }

  public async getRPCAddress(): Promise<string> {
    if (!this.url) {
      return "";
    }

    return this.url.pathname === "/" ? this.url.origin : this.url.href;
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

  protected abstract getGasPrice(): Promise<number | undefined>;

  protected abstract getGasLimit(): Promise<number | undefined>;

  protected abstract defaultProtocol(): string;

  private prepareUrl(url: URL | string): URL {
    if (typeof url === "string") {
      if (!url.match(protocolRegExp)) {
        url = `${this.defaultProtocol()}${url}`;
      }

      url = new URL(url);
    }

    return url;
  }
}
