import { ICompiler } from './ICompiler';
import { INetwork } from './INetwork';

export interface IConfiguration {
  network: string;
  networks: {
    [name: string]: INetwork;
  };
  contracts_directory: string;
  contracts_build_directory: string;
  compilers: {
    solc: ICompiler;
    external: ICompiler;
  };
}
