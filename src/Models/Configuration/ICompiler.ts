export interface ICompiler {
  version: string;
  docker: boolean;
  settings: {
    optimizer: {
      enabled: boolean,
      runs: number,
    },
    evmVersion: string,
  };

  // For external compilers
  command: string;
  targets: object[];
}
