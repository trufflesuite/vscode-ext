// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import abiDecoder from 'abi-decoder';
import {TRANSACTION_DEFAULT_METHOD_NAME} from '../constants/transaction';
import {ITransactionInputData} from '../models/ITransactionInputData';

export class TransactionInputDataDecoder {
  public addContractAbi(abi: []) {
    abiDecoder.addABI(abi);
  }

  // Use addContractAbi before using decode
  public async decode(txInput: string): Promise<ITransactionInputData> {
    const decodedInput = abiDecoder.decodeMethod(txInput);
    return decodedInput
      ? {methodName: decodedInput.name, params: decodedInput.params}
      : {methodName: TRANSACTION_DEFAULT_METHOD_NAME, params: []};
  }
}
