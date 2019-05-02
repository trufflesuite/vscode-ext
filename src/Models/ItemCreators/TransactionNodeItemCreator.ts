// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { TransactionNode } from '../TransactionNode';
import { ItemCreator } from './ItemCreator';

export class TransactionNodeItemCreator extends ItemCreator {
  protected createFromObject(obj: { [key: string]: any }): TransactionNode {
    const { label, dns } = obj;

    return new TransactionNode(label, dns);
  }

  protected getRequiredFields(): Array<{ fieldName: string, type: string }> {
    const requiredFields = super.getRequiredFields();

    return requiredFields.concat({ fieldName: 'dns', type: 'string' });
  }
}
