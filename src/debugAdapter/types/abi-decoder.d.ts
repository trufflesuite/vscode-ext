// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

declare module "abi-decoder" {
  interface Decoded {
    name: string;
    params: any[];
  }

  function addABI(abi: []): void;
  function decodeMethod(input: string): Decoded;

  export { addABI, decodeMethod };
}
