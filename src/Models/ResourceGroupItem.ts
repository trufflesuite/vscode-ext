// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { QuickPickItem } from 'vscode';

export class ResourceGroupItem implements QuickPickItem {
  public readonly label: string;
  public readonly description: string;

  constructor(label?: string, location?: string) {
    this.label = label || '';
    this.description = location || '';
  }
}
