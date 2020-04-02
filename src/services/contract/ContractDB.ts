// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { EventEmitter } from 'events';
import { Telemetry } from '../../TelemetryClient';
import { AbstractAdapter } from './AbstractAdapter';
import { ContractInstance } from './ContractInstance';
import { InMemoryAdapter } from './InMemoryAdapter';
import { TruffleDBAdapter } from './TruffleDBAdapter';

class ExtensionContractDB {
  public readonly bus: EventEmitter;
  private adapter?: AbstractAdapter;

  constructor() {
    this.bus = new EventEmitter();
  }

  public async initialize(adapterType: AdapterType): Promise<void> {
    Telemetry.sendEvent('ContractDB.initialize', { adapterType });
    if (this.adapter) {
      await this.adapter.dispose();
      this.adapter = undefined;
    }

    if (adapterType === AdapterType.TRUFFLE_DB) {
      this.adapter = new TruffleDBAdapter();
    }

    if (adapterType === AdapterType.IN_MEMORY) {
      this.adapter = new InMemoryAdapter();
    }

    if (!this.adapter) {
      Telemetry.sendEvent('ContractDB.initialize.unknownAdapterType', { adapterType });
      return;
    }

    await this.adapter.initialize();
  }

  public async getContractInstances(contractName: string): Promise<ContractInstance[]> {
    if (this.adapter) {
      return [...(await this.adapter.getContractInstances(contractName))]; // get a copy of original array
    }

    return [];
  }

  public async getContractInstance(contractName: string, instanceId: string): Promise<ContractInstance | undefined> {
    return this.adapter && await this.adapter.getContractInstance(contractName, instanceId);
  }

  public async updateContracts(): Promise<void> {
    if (this.adapter) {
      const contracts: ContractInstance[] = await this.adapter.getChangedContractInstances();
      const contractNames = contracts
        .map((contract) => contract.contractName)
        .filter((contractName, index, arr)  => arr.indexOf(contractName) === index);

      this.bus.emit('updateContracts', contractNames);
    }
  }

  public async dispose(): Promise<void> {
    return this.adapter && await this.adapter.dispose();
  }
}

export enum AdapterType {
  IN_MEMORY = 'InMemory',
  TRUFFLE_DB = 'TruffleDB',
}

// tslint:disable-next-line:variable-name
export const ContractDB = new ExtensionContractDB();
