// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Output, OutputLabel} from '@/Output';
import {Telemetry} from '../../Telemetry';
import {NetworkService} from '../NetworkService';
import {AbstractAdapter} from './AbstractAdapter';
import type {Contract} from './Contract';
import {ContractInstanceWithMetadata} from './ContractInstanceWithMetadata';
import {ContractService} from './ContractService';
import NetworkMap = NetworkService.NetworkMap;

// This class works only with workspace
export class InMemoryAdapter extends AbstractAdapter {
  private readonly db: {[key: string]: ContractInstanceWithMetadata[]};

  constructor() {
    super();

    this.db = {};
  }

  public async initialize(): Promise<void> {
    const [contracts, networkMaps] = await this.getContractsAndNetworksMap();

    contracts.forEach((contract) => {
      this.db[contract.contractName] = this.getHistoryFromCompiledContract(contract, networkMaps);
    });
  }

  public async getContractInstances(contractName: string): Promise<ContractInstanceWithMetadata[]> {
    return this.getHistory(contractName);
  }

  public async getContractInstance(
    contractName: string,
    instanceId: string
  ): Promise<ContractInstanceWithMetadata | undefined> {
    const history = await this.getHistory(contractName);
    return history.find((contractInstance) => contractInstance.id === instanceId);
  }

  public async getChangedContractInstances(): Promise<ContractInstanceWithMetadata[]> {
    const changedInstances: ContractInstanceWithMetadata[] = [];
    const [contracts, networkMaps] = await this.getContractsAndNetworksMap();

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

    return changedInstances;
  }

  public async dispose(): Promise<void> {
    Object.keys(this.db).forEach((key) => delete this.db[key]);
  }

  private getHistory(contractName: string): ContractInstanceWithMetadata[] {
    this.db[contractName] = this.db[contractName] || [];
    return this.db[contractName];
  }

  private async getContractsAndNetworksMap(): Promise<[Contract[], NetworkMap[]]> {
    let contracts: Contract[] = [];
    let networkMaps: NetworkMap[] = [];

    try {
      contracts = await ContractService.getCompiledContractsMetadata();

      if (contracts) {
        networkMaps = await NetworkService.getNetworkMaps();
      }
    } catch (error) {
      Telemetry.sendException(error as Error);
      Output.outputLine(OutputLabel.truffleForVSCode, (error as Error).message);
    }

    return [contracts, networkMaps];
  }

  private getHistoryFromCompiledContract(
    contract: Contract,
    networkMaps: NetworkMap[]
  ): ContractInstanceWithMetadata[] {
    return Object.keys(contract.networks).map((networkKey) => {
      const foundNetwork = networkMaps.find((item) => item.network.id === networkKey);
      if (foundNetwork) {
        return new ContractInstanceWithMetadata(contract, foundNetwork.network, foundNetwork.provider);
      } else {
        return new ContractInstanceWithMetadata(contract, {id: networkKey}, null);
      }
    });
  }
}
