// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Constants } from '../Constants';

export namespace UrlValidator {

  export const urlValidationExpression = new RegExp(
    /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=]+$/gm,
  );

  export function validateHostUrl(url: string): string | null {
    const matches = url.match(UrlValidator.urlValidationExpression);
    if (matches === null || matches.length > 1) {
      return Constants.validationMessages.incorrectHostAddress;
    }

    return null;
  }

  export function splitUrl(url: string): string[] {
    const address = url.replace(/(^\w+:|^)\/\//, '');
    return address.split(':');
  }
}
