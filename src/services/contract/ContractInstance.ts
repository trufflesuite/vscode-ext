// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import uuid from "uuid";
import {Contract} from "./Contract";
import {Network} from "./Network";

export class ContractInstance {
  public readonly id: string;
  public readonly contract: Contract;
  public readonly contractName: string;
  public readonly network: Network;

  public readonly address?: string;
  public readonly transactionHash?: string;

  constructor(contract: Contract, network: Network) {
    this.id = uuid.v4();
    this.contract = contract;
    this.network = network;
    this.contractName = contract.contractName;

    const networks = contract.networks;
    const deployedNetwork = networks[network.id] || {};

    this.address = deployedNetwork.address || "";
    this.transactionHash = deployedNetwork.transactionHash;
  }
}
