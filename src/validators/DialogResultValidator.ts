// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Validator } from './validator';

export namespace DialogResultValidator {
  export function validateConfirmationResult(result: string): string | null {
    const validator = new Validator(result)
      .isNotEmpty()
      .isConfirmationValue();

    return validator.getErrors();
  }
}
