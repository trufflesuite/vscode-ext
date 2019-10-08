// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { BigIntMath } from 'helpers';

const intInputs = Array(32)
  .fill(0)
  .map((_, index) => (index + 1) * 8)
  .reduce((acc, pow) => {
    const uintMax = BigIntMath.pow(2n, pow) - 1n;
    const intMax = BigIntMath.pow(2n, pow - 1) - 1n;
    const intMin = -intMax;

    acc[`int${pow}`] = {
      min: intMin,
      max: intMax,
      pow
    };

    acc[`uint${pow}`] = {
      min: 0n,
      max: uintMax,
      pow
    };

    return acc;
  }, {});

const getMessageInvalidAddress = (inputName) => {
  return `The first characters of ${inputName} must be '0x'. `
    + 'Address should have letter from a to z, A to Z, digits. Length must be 42 characters.';
};

export class Constants {
  static executionSection = {
    variableTypes: {
      address: 'address',
      string: 'string',
      bool: 'bool',
    },

    intInputs,

    validationMessages: {
      address: getMessageInvalidAddress,
    },
    validationRegexps: {
      address: /^(0x)[a-zA-Z0-9]{40}$/g,
    },
    placeholder: {
      address: '0x0000000000000000000000000000000000000000',
    },
    arrayTypeRegexp: /\w*\[\d*\]/g,
  };
}
