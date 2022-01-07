// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import { Constants } from "../../Constants";
import { IRule } from "../validator";

export class IsConfirmationValue implements IRule {
  private readonly yesNoOptions: string[];

  constructor() {
    this.yesNoOptions = [Constants.confirmationDialogResult.yes, Constants.confirmationDialogResult.no];
  }

  public validate(value: string): string | null {
    const isConfirmationValue = this.yesNoOptions.map((option) => option.toLowerCase()).includes(value.toLowerCase());
    return isConfirmationValue ? null : Constants.validationMessages.invalidConfirmationResult;
  }
}
