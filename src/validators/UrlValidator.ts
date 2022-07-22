// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Constants} from '../Constants';
import {Validator} from './validator';

export namespace UrlValidator {
  export function validateHostUrl(url: string): string | null {
    const validator = new Validator(url).isNotEmpty().isUrl();

    return validator.getErrors();
  }

  export function validatePort(port: string | number): string | null {
    return `${port}`.match(Constants.validationRegexps.port) ? null : Constants.validationMessages.invalidPort;
  }
}
