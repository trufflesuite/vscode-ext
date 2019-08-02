// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as uuid from 'uuid';
import { Contract } from './Contract';
import { Network } from './Network';
import { Provider } from './Provider';

export class ContractInstance {
  public readonly id: string;
  public readonly contractName: string;
  public readonly contract: Contract;
  public readonly network: Network;
  public readonly provider: Provider | null;
  public readonly updateDate: string;

  public readonly address?: string;
  public readonly transactionHash?: string;

  constructor(contract: Contract, network: Network, provider: Provider | null) {
    this.id = uuid.v4();
    this.contract = contract;
    this.contractName = contract.contractName;
    this.network = network;
    this.provider = provider;
    this.updateDate = new Date(contract.updatedAt).toISOString();

    const networks = contract.networks;
    const deployedNetwork = networks[network.id] || {};

    this.address = deployedNetwork.address || '';
    this.transactionHash = deployedNetwork.transactionHash;
  }
}
