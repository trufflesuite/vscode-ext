// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Service} from '../../Models/TreeItems';
import {ServiceView} from '../ServiceView';
import {ViewCreator} from './ViewCreator';

export class ServiceViewCreator extends ViewCreator {
  public create(serviceItem: Service): ServiceView {
    return new ServiceView(serviceItem);
  }
}
