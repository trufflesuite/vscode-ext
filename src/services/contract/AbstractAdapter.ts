// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {ContractInstance} from "./ContractInstance";

export abstract class AbstractAdapter {
  public abstract initialize(): Promise<void>;
  public abstract getContractInstances(contractName: string): Promise<ContractInstance[]>;
  public abstract getContractInstance(contractName: string, instanceId: string): Promise<ContractInstance | undefined>;
  public abstract getChangedContractInstances(truffleConfigPath?: string): Promise<ContractInstance[]>;
  public abstract dispose(): Promise<void>;
}
