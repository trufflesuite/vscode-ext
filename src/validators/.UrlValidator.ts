// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Validator} from './validator';

const PORT_RE =
  /^([1-9]|[1-8][0-9]|9[0-9]|[1-8][0-9]{2}|9[0-8][0-9]|99[0-9]|[1-8][0-9]{3}|9[0-8][0-9]{2}|99[0-8][0-9]|999[0-9]|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/;

export const INVALID_PORT_MSG = 'Invalid port.';

export namespace UrlValidator {
  export function validateHostUrl(url: string): string | null {
    const validator = new Validator(url).isNotEmpty().isUrl();

    return validator.getErrors();
  }

  export function validatePort(port: string | number): string | null {
    return `${port}`.match(PORT_RE) ? null : INVALID_PORT_MSG;
  }
}
