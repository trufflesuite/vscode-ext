// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Constants} from "../Constants";
import {TruffleConfig, TruffleConfiguration} from "../helpers";
import {Network} from "./contract/Network";
import {Provider} from "./contract/Provider";
import {HttpService} from "./HttpService";

export namespace NetworkService {
  interface INetworkResponse {
    jsonrpc: string;
    id: number;
    result: string;
  }

  export interface NetworkMap {
    network: Network;
    provider: Provider | null;
  }

  export async function getNetworkMaps(ignoreUnidentifiedNetworks: boolean = true): Promise<NetworkMap[]> {
    const truffleConfigPath = TruffleConfiguration.getTruffleConfigUri();
    const truffleConfig = new TruffleConfig(truffleConfigPath);
    const truffleNetworks = truffleConfig.getNetworks();
    const networkMaps: NetworkMap[] = [];

    for (const truffleNetwork of truffleNetworks) {
      const networkMap = await getNetworkMap(truffleNetwork, ignoreUnidentifiedNetworks);
      if (networkMap) {
        networkMaps.push(networkMap);
      }
    }

    return networkMaps;
  }

  export async function getNetworkMapByNetworkName(
    networkName: string,
    ignoreUnidentifiedNetworks: boolean = true
  ): Promise<NetworkMap | undefined> {
    const truffleConfigPath = TruffleConfiguration.getTruffleConfigUri();
    const truffleConfig = new TruffleConfig(truffleConfigPath);
    const truffleNetworks = truffleConfig.getNetworks();
    const truffleNetwork = truffleNetworks.find((item) => item.name === networkName);

    if (!truffleNetwork) {
      return;
    }

    return getNetworkMap(truffleNetwork, ignoreUnidentifiedNetworks);
  }

  export async function getNetworkIdByHost(host: string): Promise<string | undefined> {
    try {
      const response = (await HttpService.sendRPCRequest(host, Constants.rpcMethods.netVersion)) as INetworkResponse;
      return response.result;
    } catch (error) {
      return undefined;
    }
  }

  async function getNetworkMap(
    truffleNetwork: TruffleConfiguration.INetwork,
    ignoreUnidentifiedNetworks: boolean
  ): Promise<NetworkMap | undefined> {
    const options = truffleNetwork.options;
    const host = getTruffleNetworkHost(options);
    const networkId = options.network_id !== "*" ? options.network_id + "" : await getNetworkIdByHost(host);

    if (ignoreUnidentifiedNetworks && networkId === undefined) {
      return;
    }

    return {
      network: {id: networkId || "*", name: truffleNetwork.name},
      provider: host ? {host, options: {mnemonic: options.provider && options.provider.mnemonic}} : null,
    };
  }

  function getTruffleNetworkHost(networkOptions: TruffleConfiguration.INetworkOption): string {
    return (
      `${networkOptions.provider ? networkOptions.provider.url : ""}` ||
      `${networkOptions.host ? networkOptions.host : ""}${networkOptions.port ? ":" + networkOptions.port : ""}`
    );
  }
}
