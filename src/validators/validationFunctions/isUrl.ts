// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import { Constants } from "../../Constants";
import { IRule } from "../validator";

export class IsUrl implements IRule {
  public validate(value: string): string | null {
    const isUrl = value.search(Constants.validationRegexps.isUrl) !== -1;
    return isUrl ? null : Constants.validationMessages.invalidHostAddress;
  }
}
