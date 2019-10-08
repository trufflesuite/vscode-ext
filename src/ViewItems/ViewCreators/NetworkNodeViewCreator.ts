// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { NetworkNode } from '../../Models/TreeItems';
import { NetworkNodeView } from '../NetworkNodeView';
import { ViewCreator } from './ViewCreator';

export class NetworkNodeViewCreator extends ViewCreator {
  public create(networkNode: NetworkNode): NetworkNodeView {
    return new NetworkNodeView(networkNode);
  }
}
