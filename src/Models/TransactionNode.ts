// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Constants } from '../Constants';
import { ExtensionItem } from './ExtensionItem';
import { ItemType } from './ItemType';

export class TransactionNode extends ExtensionItem {
  private readonly dns: string;

  constructor(transactionNodeName: string, dns: string) {
    super(ItemType.TRANSACTION_NODE, transactionNodeName);

    this.contextValue = Constants.contextValue.transactionNode;
    this.iconPath = Constants.icons.transactionNode;

    this.dns = dns;
  }

  public toJSON(): { [p: string]: any } {
    const obj = super.toJSON();
    obj.dns = this.dns;
    return obj;
  }
}
