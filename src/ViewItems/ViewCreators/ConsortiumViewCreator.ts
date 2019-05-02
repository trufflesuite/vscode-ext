// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Consortium } from '../../Models';
import { ConsortiumView } from '../ConsortiumView';
import { ViewCreator } from './ViewCreator';

export class ConsortiumViewCreator extends ViewCreator {
  public create(consortiumItem: Consortium): ConsortiumView {
    return new ConsortiumView(consortiumItem);
  }
}
