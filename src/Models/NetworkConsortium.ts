// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Constants } from '../Constants';
import { showInputBox, TruffleConfiguration } from '../helpers';
import { ItemType } from './ItemType';
import { ProtectedConsortium } from './ProtectedConsortium';

export abstract class NetworkConsortium extends ProtectedConsortium {

  protected constructor(itemType: ItemType, consortiumName: string, description?: string) {
    super(itemType, consortiumName, description);
  }

  public async getTruffleNetwork(): Promise<TruffleConfiguration.INetwork> {
    const network = await super.getTruffleNetwork();

    network.options.gasPrice = await this.getGasPrice();
    network.options.gas = await this.getGasLimit();

    return network;
  }

  protected async getGasPrice(): Promise<number> {
    const value = await showInputBox({
      ignoreFocusOut: true,
      prompt: Constants.paletteABSLabels.valueOrDefault(
        Constants.propertyLabels.gasPrice,
        Constants.defaultContractSettings.gasPrice),
      validateInput: this.validation,
    });

    if (!value) {
      return Constants.defaultContractSettings.gasPrice;
    } else {
      return Number(value);
    }
  }

  protected async getGasLimit(): Promise<number> {
    const value = await showInputBox({
      ignoreFocusOut: true,
      prompt: Constants.paletteABSLabels.valueOrDefault(
        Constants.propertyLabels.gasLimit,
        Constants.defaultContractSettings.gasLimit),
      validateInput: this.validation,
    });

    if (!value) {
      return Constants.defaultContractSettings.gasLimit;
    } else {
      return Number.parseInt(value, 0);
    }
  }

  private validation(value: string): string | undefined {
    return value && !value.match(new RegExp(/^\d+$/g)) ?
      Constants.validationMessages.valueShouldBeNumberOrEmpty :
      undefined;
  }
}
