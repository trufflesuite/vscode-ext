// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Layer} from '../../Models/TreeItems/Layer';
import {LayerView} from '../LayerView';
import {ViewCreator} from './ViewCreator';

export class LayerViewCreator extends ViewCreator {
  public create(LayerItem: Layer): LayerView {
    return new LayerView(LayerItem);
  }
}
