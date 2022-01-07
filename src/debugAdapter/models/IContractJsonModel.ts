// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

export interface IContractJsonModel {
  abi: [];
  ast: any;
  bytecode: string;
  compiler: any;
  contractName: string;
  deployedBytecode: string;
  deployedSourceMap: string;
  source: string;
  sourceMap: string;
  sourcePath: string;
  networks: {
    [networkId: string]: {
      address: string;
    };
  };
}
