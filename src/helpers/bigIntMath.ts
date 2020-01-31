// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

export const bigIntMath = {
  // eval required because babel translate ** to Math.pow
  // tslint:disable-next-line:no-eval
  pow: (value: BigInt, pow: number) => BigInt(eval(`BigInt(${value}) ** BigInt(${pow})`)),
};
