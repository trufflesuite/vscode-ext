// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { TransactionNode } from '../../Models';
import { TransactionNodeView } from '../TransactionNodeView';
import { ViewCreator } from './ViewCreator';

export class TransactionNodeViewCreator extends ViewCreator {
  public create(transactionNodeItem: TransactionNode): TransactionNodeView {
    return new TransactionNodeView(transactionNodeItem);
  }
}
