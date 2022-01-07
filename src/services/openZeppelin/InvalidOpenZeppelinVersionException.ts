// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

export enum CurrentOpenZeppelinVersionLocation {
  projectJson,
  userSettings,
}

export class InvalidOpenZeppelinVersionException extends Error {
  constructor(public invalidVersion: string, public location: CurrentOpenZeppelinVersionLocation, message?: string) {
    super(message);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidOpenZeppelinVersionException);
    }

    this.name = "InvalidOpenZeppelinException";
  }
}
