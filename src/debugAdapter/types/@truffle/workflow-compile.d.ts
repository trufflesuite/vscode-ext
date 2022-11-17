// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.
declare module '@truffle/workflow-compile' {
  import type {Compilation, CompiledContract} from '@truffle/compile-common';

  interface Artifacts {
    /**
     * An list of codec-style compilations; this method of specifying a project
     * is mostly intended for internal Truffle use for now, but you can see the
     * documentation of the Compilation type if you want to use it.
     */
    compilations: Array<Compilation>;
    /**
     * A list of contracts involved in the compilation.
     */
    contracts: Array<CompiledContract>;
  }

  /**
   * Compiles contracts found in contracts_directory and
   * saves them in contracts_build_directory
   *
   * @param {TruffleConfig} config - from '@truffle/config' - Config.detect({ workingDirectory: workingDirectory })
   * @return {Artifacts}
   */
  function compile(config: TruffleConfig): Promise<Artifacts>;

  export {Artifacts, compile};
}
