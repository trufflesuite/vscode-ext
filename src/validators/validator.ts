// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
  HasDigit,
  HasLowerCase,
  HasNoForbiddenChar,
  HasSpecialChar,
  HasUpperCase,
  IsAvailable,
  IsConfirmationValue,
  IsLowerCase,
  IsNotEmpty,
  IsUrl,
  LengthRange,
} from './validationFunctions';

export interface IRule {
  validate(value: string): string | null | Promise<string | null>;
}

export class Validator {
  private errors: Set<string> = new Set();

  constructor(private readonly value: string) {}

  public getErrors(): string | null {
    return Array.from(this.errors).join('\r\n') || null;
  }

  public hasLowerCase(): Validator {
    this.validateSync(new HasLowerCase());
    return this;
  }

  public hasUpperCase(): Validator {
    this.validateSync(new HasUpperCase());
    return this;
  }

  public isConfirmationValue(): Validator {
    this.validateSync(new IsConfirmationValue());
    return this;
  }

  public isLowerCase(): Validator {
    this.validateSync(new IsLowerCase());
    return this;
  }

  public isUrl(): Validator {
    this.validateSync(new IsUrl());
    return this;
  }

  public hasDigit(): Validator {
    this.validateSync(new HasDigit());
    return this;
  }

  public hasSpecialChar(specialChars: RegExp): Validator {
    this.validateSync(new HasSpecialChar(specialChars));
    return this;
  }

  public hasNoForbiddenChar(forbiddenChars: RegExp, errorMessage: string): Validator {
    this.validateSync(new HasNoForbiddenChar(forbiddenChars, errorMessage));
    return this;
  }

  public inLengthRange(min: number, max: number): Validator {
    this.validateSync(new LengthRange(min, max));
    return this;
  }

  public isNotEmpty(): Validator {
    this.validateSync(new IsNotEmpty());
    return this;
  }

  public async isAvailable(
    checkAvailable: (name: string) => Promise<{
      message: string | null,
      nameAvailable: boolean,
      reason: string,
    } | boolean>,
    errorMessage?: (error: string) => string,
  ): Promise<Validator> {
    await this.validate(new IsAvailable(
      checkAvailable,
      errorMessage,
    ));

    return this;
  }

  private validateSync(fn: IRule): void {
    const error = fn.validate(this.value) as string | null;

    if (error) {
      this.errors.add(error);
    }
  }

  private async validate(fn: IRule): Promise<void> {
    const error = await fn.validate(this.value);

    if (error) {
      this.errors.add(error);
    }
  }
}
