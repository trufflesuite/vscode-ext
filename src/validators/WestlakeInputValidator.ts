// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Constants } from '../Constants';

export namespace WestlakeInputValidator {
  export function validateAccessPassword(password: string): string | null {
    if (!password) {
      return Constants.validationMessages.valueCannotBeEmpty;
    }

    if (!password.match(new RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?!.*[#`*"'\-%;]).{12,72}$/g))) {
      return Constants.validationMessages.incorrectPassword;
    }

    return null;
  }

  export function validateNames(name: string): string | null {
    if (!name) {
      return Constants.validationMessages.valueCannotBeEmpty;
    }

    if (!name.match(new RegExp(/^[a-z](?=.*[a-z0-9]).{1,19}$/g))) {
      return Constants.validationMessages.incorrectName;
    }

    return null;
  }
}
