// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { window } from 'vscode';
import { Constants } from './Constants';
import { vscodeEnvironment } from './helpers';
import { Telemetry } from './TelemetryClient';
import { ConsortiumView } from './ViewItems';

export namespace AzureBlockchain {
  export async function copyRPCEndpointAddress(consortiumNode: ConsortiumView): Promise<void> {
    Telemetry.sendEvent('AzureBlockchain.copyRPCEndpointAddress.commandStarted');
    const rpcEndpointAddress = await consortiumNode.getRPCAddress();
    Telemetry.sendEvent(
      'AzureBlockchain.copyRPCEndpointAddress.getRPCAddress',
      { data: Telemetry.obfuscate(rpcEndpointAddress) },
    );
    await AzureBlockchain.addDataInClipboard(Constants.rpcEndpointAddress, rpcEndpointAddress);
  }

  export async function addDataInClipboard(typeOfData: string, data?: string | null) {
    if (data) {
      await vscodeEnvironment.writeToClipboard(data);
      window.showInformationMessage(typeOfData + Constants.dataCopied);
    }
  }

  export async function viewGasEstimates(): Promise<void> {
    window.showInformationMessage('"View Gas Estimates with Remix" command does not implemented yet.');
  }
}
