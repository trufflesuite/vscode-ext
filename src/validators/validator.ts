// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.
import {Constants} from '@/Constants';

const IS_LOWER_CASE = /^[a-z0-9_\-!@$^&()+=?/<>|[\]{}:.\\~ #`*"'%;,]+$/g;

export class Validator {
  private errors: Set<string> = new Set();

  constructor(private readonly value: string) {}

  public getErrors(): string | null {
    return Array.from(this.errors).join('\r\n') || null;
  }

  public isConfirmationValue(): Validator {
    const yesNoOptions = [Constants.confirmationDialogResult.yes, Constants.confirmationDialogResult.no];
    return this.validate((value) => {
      const isConfirmationValue = yesNoOptions.map((option) => option.toLowerCase()).includes(value.toLowerCase());
      return isConfirmationValue ? null : Constants.validationMessages.invalidConfirmationResult;
    });
  }

  public isLowerCase(): Validator {
    return this.validate((value) => {
      const isLowerCase = value.search(IS_LOWER_CASE) !== -1;
      return isLowerCase || !value ? null : Constants.validationMessages.onlyLowerCaseAllowed;
    });
  }

  public isUrl(): Validator {
    return this.validate((value) => {
      const isUrl = value.search(Constants.validationRegexps.isUrl) !== -1;
      return isUrl ? null : Constants.validationMessages.invalidHostAddress;
    });
  }

  public hasNoForbiddenChar(forbiddenChars: RegExp, errorMessage: string): Validator {
    return this.validate((value) => {
      const hasForbiddenChars = value.search(forbiddenChars) !== -1;
      return hasForbiddenChars ? errorMessage : null;
    });
  }

  public isNotEmpty(): Validator {
    return this.validate((value) => (value.trim() ? null : Constants.validationMessages.valueCannotBeEmpty));
  }

  /**
   * Validates the given `value` of this `Validator` using the validation function `fn` and
   * appends the error if any to this `Validator`.
   *
   * The validation function should return `null` when there is no validation error.
   * Otherwise it should return the error message to append to this `Validator`.
   *
   * @param fn the validation function to validate this `value`.
   * @returns this `Validator` to use method chaining.
   */
  private validate(fn: (value: string) => string | null) {
    const error = fn(this.value);

    if (error) {
      this.errors.add(error);
    }

    return this;
  }
}
