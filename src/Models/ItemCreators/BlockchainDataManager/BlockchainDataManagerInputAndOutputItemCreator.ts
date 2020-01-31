// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ItemType } from '../../ItemType';
import { BlockchainDataManagerInputAndOutput } from '../../TreeItems/BlockchainDataManager/BlockchainDataManagerInputAndOutput';
import { ItemCreator } from '../ItemCreator';

export class BlockchainDataManagerInputAndOutputItemCreator extends ItemCreator {
  protected getRequiredFields(): Array<{ fieldName: string, type: string }> {
    const requiredFields = super.getRequiredFields();
    requiredFields.push(...[
      { fieldName: 'label', type: 'string' },
    ]);

    return requiredFields;
  }

  protected getAdditionalConstructorArguments(obj: { [key: string]: any }): any[] {
    return [
      ...super.getAdditionalConstructorArguments(obj),
      obj.label,
      obj.itemType,
    ];
  }

  protected createFromObject(
    label: string,
    itemType: ItemType.BLOCKCHAIN_DATA_MANAGER_INPUT_GROUP | ItemType.BLOCKCHAIN_DATA_MANAGER_OUTPUT_GROUP,
  ): BlockchainDataManagerInputAndOutput {
    return new BlockchainDataManagerInputAndOutput(itemType, label);
  }
}
