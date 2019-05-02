// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

export class CancellationEvent extends Error {
  constructor(message?: string) {
    super(message);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CancellationEvent);
    }

    this.name = 'CancellationEvent';
  }
}
