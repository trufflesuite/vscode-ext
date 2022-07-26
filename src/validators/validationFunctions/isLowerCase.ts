// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Constants} from '../../Constants';
import {IRule} from '../validator';

export class IsLowerCase implements IRule {
  public validate(value: string): string | null {
    const isLowerCase = value.search(Constants.validationRegexps.isLowerCase) !== -1;
    return isLowerCase || !value ? null : Constants.validationMessages.onlyLowerCaseAllowed;
  }
}
