// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import { QuickPickItem } from "vscode";

export class ConsortiumItem implements QuickPickItem {
  public readonly consortiumName: string;
  public readonly memberName: string;
  public readonly resourceGroup: string;
  public readonly subscriptionId: string;
  public readonly location: string;
  public readonly url?: string;

  public readonly label: string;

  constructor(
    consortiumName: string,
    subscriptionId: string,
    resourceGroup: string,
    memberName: string,
    location: string,
    url?: string
  ) {
    this.consortiumName = consortiumName;
    this.subscriptionId = subscriptionId;
    this.resourceGroup = resourceGroup;
    this.memberName = memberName;
    this.location = location;
    this.url = url;

    this.label = consortiumName;
  }
}
