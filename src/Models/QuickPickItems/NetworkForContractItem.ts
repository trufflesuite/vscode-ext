// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { QuickPickItem } from 'vscode';

export class NetworkForContractItem implements QuickPickItem {
  public readonly label: string;
  public readonly host: string;
  public readonly contractAddress: string;

  constructor(label: string, host: string, contractAddress: string) {
    this.label = label;
    this.host = host;
    this.contractAddress = contractAddress;
  }
}
