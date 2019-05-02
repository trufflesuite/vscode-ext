// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Network } from '../Network';
import { ItemCreator } from './ItemCreator';

export class NetworkItemCreator extends ItemCreator {
  protected createFromObject(obj: { [key: string]: any }): Network {
    const { label, itemType } = obj;

    return new Network(label, itemType);
  }
}
