// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Consortium } from '../Models';
import { ExtensionView } from './ExtensionView';

export class ConsortiumView extends ExtensionView<Consortium> {
  constructor(consortiumItem: Consortium) {
    super(consortiumItem);
  }

  public async getRPCAddress(): Promise<string> {
    return this.extensionItem.getRPCAddress();
  }

  public async getAccessKey(): Promise<string> {
    return this.extensionItem.getAccessKey();
  }
}
