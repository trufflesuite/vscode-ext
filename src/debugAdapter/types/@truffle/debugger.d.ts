// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.


declare module "@truffle/debugger2" {
}
declare module "@truffle/debugger" {
  interface Selectors {
    // FIXME: there are more selectors in the latest release we can add in here?
    solidity: any;
    evm: any;
    controller: any;
    trace: any;
  }
  const selectors: Selectors;

  interface Session {
    removeAllBreakpoints: () => Promise<void>;
    view: (selectors: any) => any;
    addBreakpoint: (breakPoint: any) => {};
    variables: () => Promise<any>;
    continueUntilBreakpoint: () => Promise<void>;
    stepNext: () => Promise<void>;
    stepInto: () => Promise<void>;
    stepOut: () => Promise<void>;
  }

  interface Debugger {
    connect: () => Session;
  }

  /**
   * Instantiates a Debugger for a given transaction hash.
   * Throws on failure.  If you want a more failure-tolerant method,
   * use forProject and then do a session.load inside a try.
   *
   * @param {String} txHash - transaction hash with leading "0x"
   * @param {{contracts: Array<Artifact>, files: Array<String>, provider: Web3Provider, compilations: Array<Compilation>}} options -
   * @return {Debugger} instance
   */
  function forTx(txHash: string, options: {}): Promise<Debugger>;

  export {selectors, Selectors, forTx, Session};
}
