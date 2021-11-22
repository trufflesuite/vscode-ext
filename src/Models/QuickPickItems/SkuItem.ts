// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import { QuickPickItem } from "vscode";

export class SkuItem implements QuickPickItem {
  public readonly label: string;
  public readonly description: string;

  constructor(tier: string, name: string) {
    this.label = tier;
    this.description = name;
  }
}
