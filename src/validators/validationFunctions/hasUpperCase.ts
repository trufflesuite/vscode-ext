// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Constants } from '../../Constants';
import { IRule } from '../validator';

export class HasUpperCase implements IRule {
  public validate(value: string): string | null {
    const hasUpperCase = value.search(Constants.validationRegexps.upperCaseLetter) !== -1;
    return hasUpperCase ? null : Constants.validationMessages.noUpperCaseLetter;
  }
}
