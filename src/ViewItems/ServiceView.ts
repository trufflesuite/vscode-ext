// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Service} from '@/Models/TreeItems/Service';
import {ExtensionView} from './ExtensionView';

export class ServiceView extends ExtensionView<Service> {
  constructor(serviceItem: Service) {
    super(serviceItem);
  }
}
