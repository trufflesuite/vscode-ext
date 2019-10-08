// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { URL } from 'url';
import { window } from 'vscode';
import { Constants } from '../../Constants';
import { ConsortiumResourceExplorer } from '../../resourceExplorers';
import { Telemetry } from '../../TelemetryClient';
import { ItemType } from '../ItemType';
import { MnemonicNetworkNode } from './MnemonicNetworkNode';

export class AzureBlockchainNetworkNode extends MnemonicNetworkNode {
  public readonly subscriptionId: string;
  public readonly resourceGroup: string;
  public readonly memberName: string;

  constructor(
    label: string,
    url: URL | string,
    networkId: number | string,
    subscriptionId: string,
    resourceGroup: string,
    memberName: string,
  ) {
    super(
      ItemType.AZURE_BLOCKCHAIN_NETWORK_NODE,
      label,
      Constants.treeItemData.network.azure,
      url,
      networkId,
    );

    this.subscriptionId = subscriptionId;
    this.resourceGroup = resourceGroup;
    this.memberName = memberName;
  }

  public async getRPCAddress(): Promise<string> {
    const url = new URL(this.url.toString());

    try {
      const consortiumResourceExplorer = new ConsortiumResourceExplorer();
      const keys = await consortiumResourceExplorer.getAccessKeys(this);

      // Check key[0], because methods returns array[2] every time.
      // If ABS item doesn't ready yet then keys = [null, null]
      if (keys[0]) {
        return `${url.origin}/${keys[0]}`;
      }
    } catch (error) {
      Telemetry.sendException(error);
    }

    window.showInformationMessage(Constants.informationMessage.absItemNotReady);
    return '';
  }

  public toJSON(): { [key: string]: any } {
    const obj = super.toJSON();

    obj.subscriptionId = this.subscriptionId;
    obj.resourceGroup = this.resourceGroup;
    obj.memberName = this.memberName;

    return obj;
  }

  protected async getGasPrice(): Promise<number | undefined> {
    return 0;
  }

  protected async getGasLimit(): Promise<number | undefined> {
    return 0;
  }

  protected defaultProtocol(): string {
    return Constants.networkProtocols.https;
  }
}
