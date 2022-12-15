// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {InfuraLayer} from '../TreeItems/InfuraLayer';
import {ItemCreator} from './ItemCreator';

export class InfuraLayerItemCreator extends ItemCreator {
  protected getRequiredFields(): Array<{fieldName: string; type: string}> {
    const requiredFields = super.getRequiredFields();
    requiredFields.push(...[{fieldName: 'label', type: 'string'}]);

    return requiredFields;
  }

  protected getAdditionalConstructorArguments(obj: {[key: string]: any}): any[] {
    return [obj.label];
  }

  protected createFromObject(label: string): InfuraLayer {
    return new InfuraLayer(label);
  }
}
