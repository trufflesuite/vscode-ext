// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Network } from '../../Models';
import { NetworkView } from '../NetworkView';
import { ViewCreator } from './ViewCreator';

export class NetworkViewCreator extends ViewCreator {
  public create(networkItem: Network): NetworkView {
    return new NetworkView(networkItem);
  }
}
