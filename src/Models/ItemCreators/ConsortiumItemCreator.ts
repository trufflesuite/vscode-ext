// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Consortium } from '../Consortium';
import { ItemCreator } from './ItemCreator';

export abstract class ConsortiumItemCreator extends ItemCreator {
  protected createFromObject(obj: { [key: string]: any }): Consortium {
    const { label, consortiumId, urls } = obj;
    const args = this.getAdditionalConstructorArguments(obj);

    const consortium = this.createConsortium(label, ...args);

    consortium.addUrls(urls);
    consortium.setConsortiumId(consortiumId);

    return consortium;
  }

  protected getRequiredFields(): Array<{ fieldName: string, type: string }> {
    const requiredFields = super.getRequiredFields();
    requiredFields.push(...[
      { fieldName: 'urls', type: 'array' },
      { fieldName: 'consortiumId', type: 'number' },
    ]);

    return requiredFields;
  }

  protected abstract getAdditionalConstructorArguments(obj: { [key: string]: any }): any[];
  protected abstract createConsortium(consortiumName: string, ...args: any[]): Consortium;
}
