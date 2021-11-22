// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import { Constants } from "../../Constants";
import { IRule } from "../validator";

export class IsAvailable implements IRule {
  constructor(
    private readonly checkAvailable: (name: string) => Promise<
      | {
          message: string | null;
          nameAvailable: boolean;
          reason: string;
        }
      | boolean
    >,
    private readonly errorMessage?: (error: string) => string
  ) {}

  public async validate(name: string): Promise<string | null> {
    if (!!name) {
      const response = (await this.checkAvailable(name)) as { message: string; nameAvailable: boolean; reason: string };
      if (response && !response.nameAvailable && response.reason === Constants.responseReason.alreadyExists) {
        return (this.errorMessage && this.errorMessage(name)) || response.message;
      }
    }

    return null;
  }
}
