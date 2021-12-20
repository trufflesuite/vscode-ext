// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import truffleProvider from "@truffle/provider";
import Web3 from "web3";
import {ConfigurationReader} from "./configurationReader";
// import * as web3core from "web3-core";

export class Web3Wrapper extends Web3 {
  private _networkId: number | undefined;
  private _options: ConfigurationReader.INetworkOption;
  private _cachedProvider: any;

  public constructor(options: ConfigurationReader.INetworkOption) {
    const innerProvider = getWeb3InnerProvider(options);
    super(innerProvider);
    this._options = options;
  }

  // Important! It's a truffle provider instance (from truffle-provider library)
  public getProvider() {
    if (!this._cachedProvider) {
      const web3Provider = this.eth.currentProvider;
      const truffleProviderOptions = {
        provider: () => {
          return web3Provider;
        },
      };
      this._cachedProvider = truffleProvider.create(truffleProviderOptions);
    }

    return this._cachedProvider;
  }

  public getProviderUrl() {
    return getProviderUrl(this._options);
  }

  public async getNetworkId(): Promise<number> {
    if (!this._networkId) {
      this._networkId = await this.eth.net.getId();
      this.validateNetworkId(this._networkId);
    }

    return this._networkId;
  }

  public createBatchRequest() {
    return PromiseBatch(new this.BatchRequest());
  }

  private async validateNetworkId(networkId: number) {
    const declaredNetworkId = this._options.network_id;
    if (declaredNetworkId !== "*") {
      if (networkId.toString() !== declaredNetworkId.toString()) {
        const error =
          "The network id specified in the truffle config " +
          `(${networkId}) does not match the one returned by the network ` +
          `(${declaredNetworkId}).  Ensure that both the network and the ` +
          "provider are properly configured.";
        throw new Error(error);
      }
    }
  }
}

function PromiseBatch(batch: Web3.IBatchRequest) {
  const _batch = batch;
  const _requests: Array<Promise<any>> = [];
  return {
    add(method: any, hash: string) {
      const promise = new Promise<any>((accept, reject) => {
        _batch.add(
          method.request(hash, (error: any, result: any) => {
            if (error) {
              reject(error);
            }
            accept(result);
          })
        );
      });
      _requests.push(promise);
    },
    async execute(): Promise<any> {
      _batch.execute();
      return Promise.all(_requests);
    },
  };
}

function getProviderUrl(options: ConfigurationReader.INetworkOption): string {
  if (options.host && options.port) {
    const protocol = options.websockets ? "ws" : "http";
    return `${protocol}://${options.host}:${options.port}`;
  }

  if (options.provider && options.provider.url) {
    return options.provider.url;
  }

  throw new Error("Undefined network options.");
}

function getWeb3InnerProvider(options: ConfigurationReader.INetworkOption): Web3.IProvider {
  const providerUrl = getProviderUrl(options);
  let provider;
  if (providerUrl.startsWith("ws")) {
    provider = new Web3.providers.WebsocketProvider(providerUrl);
  } else {
    provider = new Web3.providers.HttpProvider(providerUrl);
  }
  return provider;
}
