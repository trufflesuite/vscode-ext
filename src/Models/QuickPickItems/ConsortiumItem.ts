// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { QuickPickItem } from 'vscode';

export class ConsortiumItem implements QuickPickItem {
  public readonly consortiumName: string;
  public readonly memberName: string;
  public readonly resourceGroup: string;
  public readonly subscriptionId: string;
  public readonly url?: string;

  public readonly label: string;

  constructor(
    consortiumName: string,
    subscriptionId: string,
    resourceGroup: string,
    memberName: string,
    url?: string,
  ) {
    this.consortiumName = consortiumName;
    this.subscriptionId = subscriptionId;
    this.resourceGroup = resourceGroup;
    this.memberName = memberName;
    this.url = url;

    this.label = consortiumName;
  }
}
