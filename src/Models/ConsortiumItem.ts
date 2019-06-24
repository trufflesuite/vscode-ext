// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { QuickPickItem } from 'vscode';

export class ConsortiumItem implements QuickPickItem {
  public readonly consortiumName: string;
  public readonly memberName: string;
  public readonly resourcesGroup: string;
  public readonly subscriptionId: string;
  public readonly url?: string;

  public readonly label: string;

  constructor(
    consortiumName: string,
    subscriptionId: string,
    resourcesGroup: string,
    memberName: string,
    url?: string,
  ) {
    this.subscriptionId = subscriptionId;
    this.resourcesGroup = resourcesGroup;
    this.memberName = memberName;
    this.url = url;
    this.consortiumName = consortiumName;

    this.label = consortiumName;
  }
}
