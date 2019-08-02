export interface IContractModel {
    address?: string;
    abi: [];
    ast: any;
    binary: string;
    compiler: any;
    contractName: string;
    deployedBinary: string;
    deployedSourceMap: string;
    source: string;
    sourceMap: string;
    sourcePath: string;
}
