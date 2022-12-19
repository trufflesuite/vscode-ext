// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {extractEnumsInfoSafe} from '@/helpers/enumExtractor';
import {EnumStorage} from '@/Models/EnumStorage';
import {Contract} from './Contract';
import {ContractInstance} from './ContractInstance';
import {Network} from './Network';
import {Provider} from './Provider';

export class ContractInstanceWithMetadata extends ContractInstance {
  public readonly provider: Provider | null;
  public readonly updateDate: string;
  public enumsInfo: EnumStorage;

  constructor(contract: Contract, network: Network, provider: Provider | null) {
    super(contract, network);

    this.updateDate = new Date(contract.updatedAt).toISOString();
    this.provider = provider;
    this.enumsInfo = extractEnumsInfoSafe(contract.contractName, contract.ast);
  }
}
