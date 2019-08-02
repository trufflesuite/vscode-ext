export interface IContractJsonModel {
    abi: [];
    ast: any;
    bytecode: string;
    compiler: any;
    contractName: string;
    deployedBytecode: string;
    deployedSourceMap: string;
    source: string;
    sourceMap: string;
    sourcePath: string;
    networks: {
        [networkId: string]: {
            address: string;
        };
    };
}
