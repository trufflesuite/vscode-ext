// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { LocalService } from '../TreeItems';
import { ItemCreator } from './ItemCreator';

export class LocalServiceItemCreator extends ItemCreator {
  protected createFromObject(): LocalService {
    return new LocalService();
  }
}
