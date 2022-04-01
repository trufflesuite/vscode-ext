// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

// All common functions across the debugAdapter package go in here.

// import { getAddress } from '@ethersproject/address'

// shorten the checksummed version of the input hash to have 0x + 4 characters at start and end
export function shortenHash(address: string, chars = 4): string {
  try {
    const parsed = address; // getAddress(address)
    return `${parsed.substring(0, chars + 2)}...${parsed.substring(parsed.length - chars)}`;
  } catch (error) {
    throw Error(`Invalid 'address' parameter '${address}'.`);
  }
}
