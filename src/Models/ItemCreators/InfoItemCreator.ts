// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Info } from '../Info';
import { ItemCreator } from './ItemCreator';

export class InfoItemCreator extends ItemCreator {
  protected createFromObject(obj: { [key: string]: any }): Info {
    const { label, description } = obj;

    return new Info(label, description);
  }
}
