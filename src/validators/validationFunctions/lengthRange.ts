// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import { Constants } from "../../Constants";
import { IRule } from "../validator";

export class LengthRange implements IRule {
  constructor(private readonly min: number, private readonly max: number) {}

  public validate(value: string): string | null {
    const inRange = value.length >= this.min && value.length <= this.max;
    return inRange ? null : Constants.validationMessages.lengthRange(this.min, this.max);
  }
}
