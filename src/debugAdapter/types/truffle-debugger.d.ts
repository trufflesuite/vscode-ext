declare module 'truffle-debugger' {
    interface Selectors {
        solidity: any,
        evm: any,
        controller: any,
        trace: any,
    }
    const selectors: Selectors;

    interface Session {
        removeAllBreakpoints: () => Promise<void>,
        view: (selectors: any) => any,
        addBreakpoint: (breakPoint: any) => {},
        variables: () => Promise<any>,
        continueUntilBreakpoint: () => Promise<void>,
        stepNext: () => Promise<void>,
        stepInto: () => Promise<void>,
        stepOut: () => Promise<void>,
    }

    interface Debugger {
        connect: () => Session,
    }

    function forTx(txHash: string, debugOptions: any): Promise<Debugger>;
    
    export { selectors, Selectors, forTx, Session }; 
}
