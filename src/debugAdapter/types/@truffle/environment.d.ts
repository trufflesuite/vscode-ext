// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

declare module '@truffle/environment' {
  import TruffleConfig from '@truffle/config';
  export class Environment {
    static async detect(config: TruffleConfig): Promise<void>;
  }
  export {Environment};
}
