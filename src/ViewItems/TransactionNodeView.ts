// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { TransactionNode } from '../Models';
import { ExtensionView } from './ExtensionView';

export class TransactionNodeView extends ExtensionView<TransactionNode> {
  constructor(transactionNodeItem: TransactionNode) {
    super(transactionNodeItem);
  }
}
