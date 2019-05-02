// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Info } from '../../Models';
import { InfoView } from '../InfoView';
import { ViewCreator } from './ViewCreator';

export class InfoViewCreator extends ViewCreator {
  public create(infoItem: Info): InfoView {
    return new InfoView(infoItem);
  }
}
