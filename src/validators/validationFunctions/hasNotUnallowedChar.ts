// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Constants } from '../../Constants';
import { IRule } from '../validator';

export class HasNotUnallowedChar implements IRule {
  constructor(private readonly unallowedChars: RegExp) {}

  public validate(value: string): string | null {
    const hasUnallowedChars = value.search(this.unallowedChars) !== -1;
    return hasUnallowedChars ? Constants.validationMessages.unallowedChars : null;
  }
}
