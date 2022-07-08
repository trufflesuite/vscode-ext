export const notAllowedSymbols = new RegExp(
  /`|~|!|@|#|\$|%|\^|&|\*|\(|\)|\+|-|=|\[|{|]|}|\||\\|'|<|,|>|\?|\/|""|;|:|"|№|\s/g
);

export interface IProvider {
  mnemonic?: string;
  raw?: string;
  url?: string;
}

export interface INetworkOption {
  /**
   * Ethereum public network
   * if "*" - match any network
   */
  network_id: string | number;
  port?: number;
  host?: string;
  /**
   * You will need this enabled to use the confirmations listener
   * or to hear Events using .on or .once. Default is false.
   */
  websockets?: boolean;
  /**
   * Gas limit used for deploys. Default is 4712388.
   */
  gas?: number;
  /**
   * Gas price used for deploys. Default is 100000000000 (100 Shannon).
   */
  gasPrice?: number;
  /**
   * From address used during migrations. Defaults to the first available account provided by your Ethereum client.
   */
  from?: string;
  /**
   * Function that returns a web3 provider instance.
   * web3 provider instance Truffle should use to talk to the Ethereum network.
   * if specified, host and port are ignored.
   * Default web3 provider using host and port options: new Web3.providers.HttpProvider("http://<host>:<port>")
   */
  provider?: IProvider;
  /**
   * true if you don't want to test run the migration locally before the actual migration (default is false)
   */
  skipDryRun?: boolean;
  /**
   * if a transaction is not mined, keep waiting for this number of blocks (default is 50)
   */
  timeoutBlocks?: number;
}

export interface INetwork {
  name: string;
  options: INetworkOption;
}

export interface ISolCompiler {
  /**
   * A version or constraint - Ex. "^0.5.0" . Can also be set to "native" to use a native solc
   */
  version: string;
  /**
   * Use a version obtained through docker
   */
  docker?: boolean;
  settings?: {
    optimizer?: {
      enabled: boolean;
      /**
       * Optimize for how many times you intend to run the code
       */
      runs: number;
    };
    /**
     * Default: "byzantium"
     */
    evmVersion?: string;
  };
}

export interface IExternalCompiler {
  command: string;
  workingDirectory: string;
  targets: object[];
}

export interface IConfiguration {
  contracts_directory: string;
  build_directory: string;
  contracts_build_directory: string;
  migrations_directory: string;
  networks?: INetwork[];
  compilers?: {
    solc?: ISolCompiler;
    external?: IExternalCompiler;
  };
}
