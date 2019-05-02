// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Constants } from '../Constants';

export namespace DialogResultValidator {
  export function validateConfirmationResult(result: string): string | null {
    if (!result ||
        ![Constants.confirmationDialogResult.yes,
          Constants.confirmationDialogResult.no]
        .includes(result.toLowerCase())) {
        return Constants.validationMessages.invalidConfirmationResult;
      }

    return null;
  }
}
