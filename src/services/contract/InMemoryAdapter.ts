// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { NetworkService } from '../NetworkService';
import { AbstractAdapter } from './AbstractAdapter';
import { Contract } from './Contract';
import { ContractInstance } from './ContractInstance';
import { ContractService } from './ContractService';
import NetworkMap = NetworkService.NetworkMap;

export class InMemoryAdapter extends AbstractAdapter {
  private readonly db: { [key: string]: ContractInstance[] };

  constructor() {
    super();

    this.db = {};
  }

  public async initialize(): Promise<void> {
    const contracts = ContractService.getCompiledContracts();

    if (contracts) {
      const networkMaps = await NetworkService.getNetworkMaps();

      contracts.forEach((contract) => {
        this.db[contract.contractName] = this.getHistoryFromCompiledContract(contract, networkMaps);
      });
    }
  }

  public async getContractInstances(contractName: string): Promise<ContractInstance[]> {
    return this.getHistory(contractName);
  }

  public async getContractInstance(contractName: string, instanceId: string): Promise<ContractInstance | undefined> {
    const history = await this.getHistory(contractName);
    return history.find((contractInstance) => contractInstance.id === instanceId);
  }

  public async getChangedContractInstances(): Promise<ContractInstance[]> {
    const changedInstances: ContractInstance[] = [];
    const contracts = ContractService.getCompiledContracts();
    if (contracts) {
      const networkMaps = await NetworkService.getNetworkMaps();

      contracts.forEach((contract) => {
        const contractName = contract.contractName;
        const history = this.getHistory(contractName);
        const currentHistory = this.getHistoryFromCompiledContract(contract, networkMaps);
        const newInstances = currentHistory.filter((contractInstance) => {
          const index = history.findIndex((historyContractInstance) => {
            return historyContractInstance.address === contractInstance.address;
          });

          return index === -1;
        });

        history.push(...newInstances);
        changedInstances.push(...newInstances);
      });
    }

    return changedInstances;
  }

  public async dispose(): Promise<void> {
    Object.keys(this.db).forEach((key) => delete this.db[key]);
  }

  private getHistory(contractName: string): ContractInstance[] {
    this.db[contractName] = this.db[contractName] || [];
    return this.db[contractName];
  }

  private getHistoryFromCompiledContract(contract: Contract, networkMaps: NetworkMap[]): ContractInstance[] {
    return Object.keys(contract.networks).map((networkKey) => {
      const foundNetwork = networkMaps.find((item) => item.network.id === networkKey);
      if (foundNetwork) {
        return new ContractInstance(contract, foundNetwork.network, foundNetwork.provider);
      } else {
        return new ContractInstance(contract, { id: networkKey }, null);
      }
    });
  }
}
