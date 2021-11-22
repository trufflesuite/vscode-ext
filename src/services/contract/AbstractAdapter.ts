// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import { ContractInstance } from "./ContractInstance";

export abstract class AbstractAdapter {
  public abstract async initialize(): Promise<void>;
  public abstract async getContractInstances(contractName: string): Promise<ContractInstance[]>;
  public abstract async getContractInstance(
    contractName: string,
    instanceId: string
  ): Promise<ContractInstance | undefined>;
  public abstract async getChangedContractInstances(): Promise<ContractInstance[]>;
  public abstract async dispose(): Promise<void>;
}
