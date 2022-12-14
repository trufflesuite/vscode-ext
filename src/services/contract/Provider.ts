// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

interface HttpHeader {
  name: string;
  value: string;
}

interface ProviderOptions {
  host?: string;
  protocol?: string;
  timeout?: number;
  headers?: HttpHeader[];
  withCredentials?: boolean;
  mnemonic?: string;
}

export interface Provider {
  host: string;
  options?: ProviderOptions;
}
