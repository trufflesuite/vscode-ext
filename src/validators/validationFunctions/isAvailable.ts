// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { IRule } from '../validator';

export class IsAvailable implements IRule {
  constructor(
    private readonly checkAvailable: (name: string) => Promise<{
      message: string | null,
      nameAvailable: boolean,
      reason: string,
    } | boolean>,
    private readonly errorMessage?: (error: string) => string,
  ) {}

  public async validate(name: string): Promise<string | null> {
    let nameAvailable: boolean;
    let message: string = '';

    if (this.errorMessage) {
      nameAvailable = !await this.checkAvailable(name) as boolean;
    } else {
      const response = await this.checkAvailable(name) as { message: string, nameAvailable: boolean };

      nameAvailable = response.nameAvailable;
      message = response.message;
    }

    return nameAvailable ? null : (this.errorMessage && this.errorMessage(name)) || message;
  }
}
