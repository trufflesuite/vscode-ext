// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { TestNetworkConsortium } from '../TestNetworkConsortium';
import { ConsortiumItemCreator } from './ConsortiumItemCreator';

export class TestNetworkConsortiumItemCreator extends ConsortiumItemCreator {
  protected getAdditionalConstructorArguments(): any[] {
    return [];
  }

  protected createConsortium(consortiumName: string): TestNetworkConsortium {
    return new TestNetworkConsortium(consortiumName);
  }
}
