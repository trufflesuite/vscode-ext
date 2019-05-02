// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { MainNetworkConsortium } from '../MainNetworkConsortium';
import { ConsortiumItemCreator } from './ConsortiumItemCreator';

export class MainNetworkConsortiumItemCreator extends ConsortiumItemCreator {
  protected getAdditionalConstructorArguments(): any[] {
    return [];
  }

  protected createConsortium(consortiumName: string): MainNetworkConsortium {
    return new MainNetworkConsortium(consortiumName);
  }
}
