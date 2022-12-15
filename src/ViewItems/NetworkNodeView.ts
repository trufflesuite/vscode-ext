// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {NetworkNode} from '../Models/TreeItems/NetworkNode';
import {ExtensionView} from './ExtensionView';

export class NetworkNodeView extends ExtensionView<NetworkNode> {
  constructor(networkNode: NetworkNode) {
    super(networkNode);
  }
}
