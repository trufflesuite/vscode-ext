// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {getTruffleConfiguration} from '@/helpers/TruffleConfiguration';
import fs from 'fs-extra';
import path from 'path';
import {HttpService} from '..';
import {Constants} from '@/Constants';
import {getPathByPlatform, getWorkspaceRoot, TruffleWorkspace} from '@/helpers/workspace';
import {Telemetry} from '@/TelemetryClient';
import {Contract} from './Contract';

export namespace ContractService {
  type PathDirectoryKey = 'contracts_directory' | 'migrations_directory' | 'contracts_build_directory';

  export async function getCompiledContractsMetadata(): Promise<Contract[]> {
    const contractPaths = await getCompiledContractsPathsFromBuildDirectory();
    const contractsMetadata = contractPaths.map((contractPath) => getCompiledContractMetadataByPath(contractPath));

    return Promise.all(contractsMetadata).then((contracts) => {
      return contracts.filter((contract) => contract !== null) as Contract[];
    });
  }

  export async function getContractsFolderPath(truffleWorkspace: TruffleWorkspace): Promise<string> {
    return getPathDirectory('contracts_directory', truffleWorkspace);
  }

  export async function getBuildFolderPath(truffleWorkspace?: TruffleWorkspace): Promise<string> {
    return getPathDirectory('contracts_build_directory', truffleWorkspace);
  }

  export async function getDeployedBytecodeByAddress(host: string, address: string): Promise<string> {
    const defaultBlock = 'latest';
    const response = await HttpService.sendRPCRequest(host, Constants.rpcMethods.getCode, [address, defaultBlock]);

    if (!response || (response && response.error)) {
      const errorMessage = response && response.error ? response.error.message : '';
      throw new Error(`getDeployedBytecodeByAddress failed. ${errorMessage}`);
    }

    return (response && (response.result as string)) || '';
  }

  function getCompiledContractMetadataByPath(contractPath: string): Promise<Contract | null> {
    if (fs.pathExistsSync(contractPath)) {
      return new Promise((resolve, reject) => {
        fs.readFile(contractPath, 'utf-8', (error, fileData) => {
          if (error) {
            reject(error);
          } else {
            const contractMetadata = JSON.parse(fileData);

            if (contractMetadata.abi && contractMetadata.bytecode) {
              resolve(new Contract(JSON.parse(fileData)));
            } else {
              resolve(null);
            }
          }
        });
      });
    }

    return Promise.resolve(null);
  }

  async function getCompiledContractsPathsFromBuildDirectory(): Promise<string[]> {
    const buildDir = await getBuildFolderPath();

    if (!fs.pathExistsSync(buildDir)) {
      throw new Error(Constants.errorMessageStrings.BuildContractsDirDoesNotExist(Telemetry.obfuscate(buildDir)));
    }

    return fs
      .readdirSync(buildDir)
      .filter((file) => path.extname(file) === Constants.contract.configuration.extension.json)
      .map((file) => path.join(buildDir, file))
      .filter((file) => fs.lstatSync(file).isFile());
  }

  async function getPathDirectory(directory: PathDirectoryKey, truffleWorkspace?: TruffleWorkspace): Promise<string> {
    const [workDir, name] = truffleWorkspace
      ? [getPathByPlatform(truffleWorkspace.workspace), truffleWorkspace.truffleConfigName]
      : [getWorkspaceRoot()!, undefined];
    const configuration = await getTruffleConfiguration(workDir, name);

    const dir = (configuration as any)[directory];

    if (dir && path.isAbsolute(dir)) {
      return dir;
    }

    return path.join(workDir, dir);
  }
}
