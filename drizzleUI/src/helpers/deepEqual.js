// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

export const deepEqual = (first, second) => {
  if (first === second) return true;

  if (
    first && second
    && typeof first === 'object' && typeof second === 'object'
  ) {
    if (first.constructor !== second.constructor) return false;

    if (Array.isArray(first) && Array.isArray(second)) {
      if (first.length !== second.length) return false;

      for (let i = 0; i < first.length; i++) {
        if (!deepEqual(first[i], second[i])) return false;
      }

      return true;
    }

    const firstKeys = Object.keys(first);
    const secondKeys = Object.keys(second);

    if (firstKeys.length !== secondKeys.length) return false;
    /* eslint-disable no-unused-vars */
    for (const key of firstKeys) {
      if (!second.hasOwnProperty(key)) return false;
    }

    for (const key of firstKeys) {
      if (!deepEqual(first[key], second[key])) return false;
    }
    /* eslint-enable no-unused-vars */

    return true;
  }

  return false;
};
