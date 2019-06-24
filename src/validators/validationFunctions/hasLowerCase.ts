// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Constants } from '../../Constants';
import { IRule } from '../validator';

export class HasLowerCase implements IRule {
  public validate(value: string): string | null {
    const hasLowerCase = value.search(Constants.validationRegexps.lowerCaseLetter) !== -1;
    return hasLowerCase ? null : Constants.validationMessages.noLowerCaseLetter;
  }
}
