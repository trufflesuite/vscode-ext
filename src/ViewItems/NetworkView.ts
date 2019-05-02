// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Network } from '../Models';
import { ExtensionView } from './ExtensionView';

export class NetworkView extends ExtensionView<Network> {
  constructor(networkItem: Network) {
    super(networkItem);
  }
}
