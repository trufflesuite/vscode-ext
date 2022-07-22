// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {INetwork} from '@/helpers/ConfigurationReader';
import {URL} from 'url';
import {Constants} from '@/Constants';
import {showInputBox} from '@/helpers/userInteraction';
import {ItemType} from '@/Models';
import {MnemonicNetworkNode} from './MnemonicNetworkNode';

export class InfuraNetworkNode extends MnemonicNetworkNode {
  constructor(label: string, url: URL | string, networkId: number | string, description?: string) {
    super(ItemType.INFURA_NETWORK_NODE, label, Constants.treeItemData.network.infura, url, networkId, description);
  }

  public async getTruffleNetwork(): Promise<INetwork> {
    return await super.getTruffleNetwork();
  }

  protected async getGasPrice(): Promise<number | undefined> {
    const value = await showInputBox({
      ignoreFocusOut: true,
      prompt: Constants.paletteLabels.valueOrDefault(
        Constants.propertyLabels.gasPrice,
        Constants.defaultContractSettings.gasPrice
      ),
      validateInput: this.validation,
    });

    if (!value) {
      return Constants.defaultContractSettings.gasPrice;
    }

    return parseInt(value, 10);
  }

  protected async getGasLimit(): Promise<number | undefined> {
    const value = await showInputBox({
      ignoreFocusOut: true,
      prompt: Constants.paletteLabels.valueOrDefault(
        Constants.propertyLabels.gasLimit,
        Constants.defaultContractSettings.gasLimit
      ),
      validateInput: this.validation,
    });

    if (!value) {
      return Constants.defaultContractSettings.gasLimit;
    }

    return parseInt(value, 10);
  }

  protected defaultProtocol(): string {
    return Constants.networkProtocols.https;
  }

  private validation(value: string): string | undefined {
    return value && !value.match(new RegExp(/^\d+$/g))
      ? Constants.validationMessages.valueShouldBeNumberOrEmpty
      : undefined;
  }
}
