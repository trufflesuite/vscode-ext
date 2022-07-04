// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

declare module '@truffle/provider' {
  interface IProviderOptions {
    provider?: any;
    host?: string;
    port?: number;
    websockets?: boolean;
  }
  function create(networkOptions: IProviderOptions): any;
  export {create};
}
