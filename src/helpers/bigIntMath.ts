// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

export const bigIntMath = {
  // eval required because babel translate ** to Math.pow

  pow: (value: BigInt, pow: number) => BigInt(eval(`BigInt(${value}) ** BigInt(${pow})`)),
};
