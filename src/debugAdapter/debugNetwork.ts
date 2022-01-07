// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import * as path from "path";
import { executeCommand } from "./cmdCommandExecutor";
import { ConfigurationReader } from "./configurationReader";
import { TRUFFLE_CONFIG_DEBUG_NETWORK_TYPE, TRUFFLE_CONFIG_NAME } from "./constants/truffleConfig";

export class DebugNetwork {
  public workingDirectory: string;
  private _basedConfig: ConfigurationReader.TruffleConfig | undefined;
  private _truffleConfiguration: ConfigurationReader.IConfiguration | undefined;
  private _networkForDebug: ConfigurationReader.INetwork | undefined;
  constructor(truffleConfigDirectory: string) {
    this.workingDirectory = truffleConfigDirectory;
  }

  public async load(): Promise<void> {
    this._basedConfig = new ConfigurationReader.TruffleConfig(path.join(this.workingDirectory, TRUFFLE_CONFIG_NAME));
    this._truffleConfiguration = await this.loadConfiguration();
    this._networkForDebug = await this.loadNetworkForDebug();
  }

  public getTruffleConfiguration() {
    return this._truffleConfiguration;
  }

  public getNetwork() {
    return this._networkForDebug;
  }

  // Port and host are defined
  public isLocalNetwork() {
    if (!this._networkForDebug || !this._networkForDebug.options) {
      throw new Error("Network is not defined. Try to call this.load()");
    }
    const options = this._networkForDebug.options;
    return !!(options.host && options.port);
  }

  private async loadConfiguration(): Promise<ConfigurationReader.IConfiguration> {
    const configuration = await this._basedConfig!.getConfiguration(this.workingDirectory);

    return {
      contracts_build_directory: this.relativeToAbsolutePath(configuration.contracts_build_directory),
      contracts_directory: this.relativeToAbsolutePath(configuration.contracts_directory),
      migrations_directory: this.relativeToAbsolutePath(configuration.migrations_directory),
    };
  }

  private async loadNetworkForDebug(): Promise<ConfigurationReader.INetwork> {
    const networks = this._basedConfig!.getNetworks();
    const networkForDebug = networks.find((n) => n.name === TRUFFLE_CONFIG_DEBUG_NETWORK_TYPE);
    if (!this.isNetworkForDebugValid(networkForDebug)) {
      const provider = await this.getProviderByResolvingConfig(TRUFFLE_CONFIG_DEBUG_NETWORK_TYPE);
      if (provider.url) {
        networkForDebug!.options.provider = {
          url: provider.url,
        };
      } else {
        throw new Error(`Truffle config is not properly defined.
                Please create ${TRUFFLE_CONFIG_DEBUG_NETWORK_TYPE} network,
                set host+port, or hdwallet/http/websocket provider.`);
      }
    }

    return networkForDebug!;
  }

  private isNetworkForDebugValid(networkForDebug: ConfigurationReader.INetwork | undefined): boolean {
    if (!networkForDebug || !networkForDebug.options) {
      throw new Error(`No ${TRUFFLE_CONFIG_DEBUG_NETWORK_TYPE} network in the truffle config`);
    }

    if (networkForDebug.options.host && networkForDebug.options.port) {
      return true;
    }
    // truffle-config helper can read only hdwallet provider
    const isHdWalletProvider = !!networkForDebug.options.provider;
    if (isHdWalletProvider) {
      return true;
    }

    return false;
  }

  private async getProviderByResolvingConfig(network: string) {
    // use truffle exec web3ProviderResolver.js to solve http- or websocket- web3 provider
    const truffleConfigReaderPath = path.join(__dirname, "web3ProviderResolver.js");
    const args = ["truffle", "exec", truffleConfigReaderPath, "--network", network];
    const result = await executeCommand(this.workingDirectory, "npx", ...args);
    const providerJson = result.split("provider%=")[1];
    return JSON.parse(providerJson);
  }

  private relativeToAbsolutePath(directory: string) {
    if (directory && path.isAbsolute(directory)) {
      return directory;
    }

    return path.join(this.workingDirectory, directory);
  }
}
