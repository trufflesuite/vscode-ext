// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import { QuickPickItem } from "vscode";

export class TransactionNodeItem implements QuickPickItem {
  public readonly transactionNodeName: string;
  public readonly url: string;
  public readonly provisioningState: string;
  public readonly label: string;

  constructor(name: string, url: string, provisioningState: string) {
    this.transactionNodeName = name;
    this.url = url;
    this.provisioningState = provisioningState;

    this.label = name;
  }
}
