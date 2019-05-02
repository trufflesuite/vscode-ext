// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { QuickPickItem } from 'vscode';
import { AzureSession } from '../azure-account.api';

export class SubscriptionItem implements QuickPickItem {
  public readonly label: string;
  public readonly description: string;
  public readonly session: AzureSession;
  public readonly subscriptionId: string;

  constructor(label: string, subscriptionId: string, session: AzureSession) {
    this.label = label;
    this.description = subscriptionId;
    this.subscriptionId = subscriptionId;
    this.session = session;
  }
}
