// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Validator} from './validator';

const NETWORK_NAME_RE = /[^\da-z]/g;

const NETWORK_NAME_MSG = 'Invalid name. Name can contain only lowercase letters and numbers.';

export namespace DialogResultValidator {
  export function validateConfirmationResult(result: string): string | null {
    const validator = new Validator(result).isNotEmpty().isConfirmationValue();

    return validator.getErrors();
  }

  export function validateLocalNetworkName(result: string): string | null {
    const validator = new Validator(result).isNotEmpty().hasNoForbiddenChar(NETWORK_NAME_RE, NETWORK_NAME_MSG);

    return validator.getErrors();
  }
}
