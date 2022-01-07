// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import { AbstractAdapter } from "./AbstractAdapter";
import { ContractInstance } from "./ContractInstance";

export class TruffleDBAdapter extends AbstractAdapter {
  public async initialize(): Promise<void> {
    return;
  }
  // @ts-ignore
  public async getContractInstances(contractName: string): Promise<ContractInstance[]> {
    throw new Error("Method is not implemented yet");
  }
  // @ts-ignore
  public async getContractInstance(contractName: string, instanceId: string): Promise<ContractInstance | undefined> {
    throw new Error("Method is not implemented yet");
  }
  public async getChangedContractInstances(): Promise<ContractInstance[]> {
    throw new Error("Method is not implemented yet");
  }
  public async dispose(): Promise<void> {
    return;
  }
}
