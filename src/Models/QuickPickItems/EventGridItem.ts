// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import { QuickPickItem } from "vscode";

export class EventGridItem implements QuickPickItem {
  public readonly eventGridName: string;
  public readonly url: string;
  public readonly label: string;

  constructor(name: string, url: string) {
    this.eventGridName = name;
    this.url = url;

    this.label = name;
  }
}
