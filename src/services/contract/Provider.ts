// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

// tslint:disable-next-line:interface-name
export interface HttpHeader {
  name: string;
  value: string;
}

// tslint:disable-next-line:interface-name
export interface ProviderOptions {
  host?: string;
  protocol?: string;
  timeout?: number;
  headers?: HttpHeader[];
  withCredentials?: boolean;
}

// tslint:disable-next-line:interface-name
export interface Provider {
  host: string;
  options?: ProviderOptions;
}
