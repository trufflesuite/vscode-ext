// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { LocalNetworkConsortium } from '../LocalNetworkConsortium';
import { ConsortiumItemCreator } from './ConsortiumItemCreator';

export class LocalNetworkConsortiumItemCreator extends ConsortiumItemCreator {
  protected getAdditionalConstructorArguments(): any[] {
    return [];
  }

  protected createConsortium(consortiumName: string): LocalNetworkConsortium {
    return new LocalNetworkConsortium(consortiumName);
  }
}
