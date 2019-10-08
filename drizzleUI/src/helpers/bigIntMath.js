// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

export const BigIntMath = {
  // eval required because babel translate ** to Math.pow
  /* eslint-disable no-eval */
  pow: (value, pow) => BigInt(eval(`BigInt(${value}) ** BigInt(${pow})`)),

  log2: (bigIntValue) => {
    let count = 0;
    let value = bigIntValue;

    while (value > 0n) {
      value /= 2n;
      count += 1;
    }

    return count;
  },

  sqrt: (value) => {
    if (value < 0n) {
      throw Error('square root of negative numbers is not supported');
    }

    if (value < 2n) {
      return value;
    }

    if (value === 4n) {
      return 2n;
    }

    const newtonIteration = (n, x0) => {
      /* eslint-disable no-bitwise */
      const x1 = ((n / x0) + x0) >> 1n;

      if (x0 === x1 || x0 === (x1 - 1n)) {
        return x0;
      }

      return newtonIteration(n, x1);
    };

    return newtonIteration(value, 1n);
  }
};
