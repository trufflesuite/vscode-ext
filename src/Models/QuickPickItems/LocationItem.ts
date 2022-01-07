// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import { QuickPickItem } from "vscode";

export class LocationItem implements QuickPickItem {
  public readonly label: string;
  public readonly description: string;

  constructor(label?: string, description?: string) {
    this.label = label || "";
    this.description = description || "";
  }
}
