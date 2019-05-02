// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Uri, window } from 'vscode';
import { ConsortiumResourceExplorer } from '../ConsortiumResourceExplorer';
import { Constants } from '../Constants';
import { AzureConsortium } from '../Models';
import { TruffleCommands } from './TruffleCommands';

export namespace WestlakeCommands {

  export async function createWestlakeConsortium(): Promise<AzureConsortium> {
    const azureResourceExplorer = new ConsortiumResourceExplorer();
    return azureResourceExplorer.createConsortium();
  }

  export async function selectWestlakeConsortium(childrenFilters?: string[]): Promise<AzureConsortium> {
    const azureResourceExplorer = new ConsortiumResourceExplorer();
    return azureResourceExplorer.selectConsortium(childrenFilters);
  }

  export async function showLedgerEventsDialog(uri: Uri): Promise<void> {
    const ledgerEventsDestination = [
      {
        cmd: pushLedgerEventsToSQL,
        label: Constants.ledgerEvents.text.sqlWithLogicApps,
      },
      {
        cmd: pushLedgerEventsToAzureEventGrid,
        label: Constants.ledgerEvents.text.azureEventGridWithFlow,
      },
      {
        cmd: pushLedgerEventsToAzureServiceBus,
        label: Constants.ledgerEvents.text.azureServiceBusWithFlow,
      },
    ];

    const target = await window.showQuickPick(
      ledgerEventsDestination,
      { placeHolder: Constants.placeholders.selectLedgerEventsDestination, ignoreFocusOut: true },
    );

    if (target === undefined) {
      throw new Error('Action aborted');
    }

    return await target.cmd(uri);
  }
}

async function pushLedgerEventsToSQL(uri: Uri): Promise<void> {
  await TruffleCommands.acquireCompiledContractUri(uri);
}

async function pushLedgerEventsToAzureEventGrid(uri: Uri): Promise<void> {
  await TruffleCommands.acquireCompiledContractUri(uri);
}

async function pushLedgerEventsToAzureServiceBus(uri: Uri): Promise<void> {
  await TruffleCommands.acquireCompiledContractUri(uri);
}
