// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Info } from '../Models';
import { ExtensionView } from './ExtensionView';

export class InfoView extends ExtensionView<Info> {
  constructor(infoItem: Info) {
    super(infoItem);
  }
}
