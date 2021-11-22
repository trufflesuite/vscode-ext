// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

export interface IContractModel {
  address?: string;
  abi: [];
  ast: any;
  binary: string;
  compiler: any;
  contractName: string;
  deployedBinary: string;
  deployedSourceMap: string;
  source: string;
  sourceMap: string;
  sourcePath: string;
}
