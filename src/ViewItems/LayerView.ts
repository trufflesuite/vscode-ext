// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Layer} from '../Models/TreeItems/Layer';
import {ExtensionView} from './ExtensionView';

export class LayerView extends ExtensionView<Layer> {
  constructor(layerItem: Layer) {
    super(layerItem);
  }
}
