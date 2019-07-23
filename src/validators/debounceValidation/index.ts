// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Constants } from '../../Constants';

export class Debounce {
  private debounceEvent: {
    timeout?: NodeJS.Timeout,
    resolve?: (value: string | null) => void,
  } = {};

  private readonly timeout: number;

  constructor(
    options: { timeout: number } = { timeout: Constants.defaultDebounceTimeout },
  ) {
    this.timeout = options.timeout;
  }

  public debounced(timeOverFunction: () => Promise<string | null>): Promise<string | null> {
    if (this.debounceEvent.timeout) {
      this.debounceEvent.resolve!(null);
      clearTimeout(this.debounceEvent.timeout);
    }

    return new Promise<string | null>((resolve, reject) => {
      this.debounceEvent.resolve = resolve;

      this.debounceEvent.timeout = setTimeout(async () => {
        try {
          resolve(await timeOverFunction());
        } catch (e) {
          reject(e);
        } finally {
          this.debounceEvent.timeout = undefined;
          this.debounceEvent.resolve = undefined;
        }
      }, this.timeout);
    });
  }
}
