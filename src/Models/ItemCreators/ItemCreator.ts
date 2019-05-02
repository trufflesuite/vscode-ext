// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { IExtensionItem } from '../IExtensionItem';

export abstract class ItemCreator {
  public create(obj: { [key: string]: any }): IExtensionItem {
    const requiredFields = this.getRequiredFields() || [];

    this.checkRequiredFields(obj, requiredFields);

    return this.createFromObject(obj);
  }

  protected abstract createFromObject(obj: { [key: string]: any }): IExtensionItem;

  protected getRequiredFields(): Array<{ fieldName: string, type: string }> {
    return [
      { fieldName: 'itemType', type: 'number' },
      { fieldName: 'label', type: 'string' },
    ];
  }

  private checkRequiredFields(
    obj: { [key: string]: any },
    requiredFields: Array<{ fieldName: string, type: string }>,
  ): void {
    requiredFields.forEach((item) => {
      const field = obj[item.fieldName];
      if (field === undefined || field === null) {
        throw new Error(`Missed required field ${item.fieldName}. JSON: ${JSON.stringify(obj)}`);
      }

      if ((item.type === 'array' && Array.isArray(field)) || (typeof field === item.type)) {
        return;
      }

      throw new Error(`Required field ${item.fieldName} should be type ${item.type}. JSON: ${JSON.stringify(obj)}`);
    });
  }
}
