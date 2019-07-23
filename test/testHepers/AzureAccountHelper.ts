// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as uuid from 'uuid';
import * as vscode from 'vscode';
import { AzureAccount } from '../../src/azure-account.api';

export namespace AzureAccountHelper {
  export const mockExtension: vscode.Extension<AzureAccount> = {
    activate: mockActivate,
    exports: {} as AzureAccount,
    extensionPath: uuid.v4(),
    id: uuid.v4(),
    isActive: true,
    packageJSON: uuid.v4(),
  };
}

async function waitAmoment() {
  await new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, 1);
  });
}

async function mockActivate() {
  await waitAmoment();
  return {} as AzureAccount;
}
