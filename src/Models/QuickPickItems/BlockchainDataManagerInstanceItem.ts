// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { QuickPickItem } from 'vscode';

export class BlockchainDataManagerInstanceItem implements QuickPickItem {
  public readonly bdmName: string;
  public readonly uniqueId: string;
  public readonly resourceGroup: string;
  public readonly subscriptionId: string;
  public readonly label: string;

  constructor(bdmName: string, subscriptionId: string, resourceGroup: string, uniqueId: string) {
    this.bdmName = bdmName;
    this.subscriptionId = subscriptionId;
    this.resourceGroup = resourceGroup;
    this.uniqueId = uniqueId;

    this.label = bdmName;
  }
}
