// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Constants} from '../../Constants';
import {IRule} from '../validator';

export class HasSpecialChar implements IRule {
  constructor(private readonly specialChars: RegExp) {}

  public validate(value: string): string | null {
    const hasSpecialChars = value.search(this.specialChars) !== -1;
    return hasSpecialChars ? null : Constants.validationMessages.noSpecialChars;
  }
}
