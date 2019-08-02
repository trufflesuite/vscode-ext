// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as fs from 'fs-extra';
import * as path from 'path';
import { Constants } from '../../Constants';
import { getWorkspaceRoot, TruffleConfiguration } from '../../helpers';
import { Contract } from './Contract';

export namespace ContractService {
  export function getContractNameBySolidityFile(solidityFilePath: string): string {
    return path.basename(solidityFilePath, Constants.contractExtension.sol);
  }

  export function getCompiledContractByContractFile(contractPath: string): Contract | null {
    if (fs.pathExistsSync(contractPath)) {
      const fileData = fs.readFileSync(contractPath, 'utf-8');
      return new Contract(JSON.parse(fileData));
    }

    return null;
  }

  export function getCompiledContractBySolidityFile(solidityFilePath: string): Contract | null {
    const contractPath = getContractPaths(solidityFilePath)[0];

    return getCompiledContractByContractFile(contractPath);
  }

  export function getCompiledContractByContractName(contractName: string): Contract | null {
    return getCompiledContractBySolidityFile(`${contractName}${Constants.contractExtension.sol}`);
  }

  export function getCompiledContracts(): Contract[] {
    const contractPaths = getContractPaths();
    const contracts = contractPaths
      .map((contractPath) => getCompiledContractByContractFile(contractPath))
      .filter((contract) => contract !== null);

    return contracts as Contract[];
  }

  export function getContractPaths(solidityFilePath?: string): string[] {
    const truffleConfigPath = TruffleConfiguration.getTruffleConfigUri();
    const truffleConfig = new TruffleConfiguration.TruffleConfig(truffleConfigPath);
    const configuration = truffleConfig.getConfiguration();
    const buildDir = path.join(getWorkspaceRoot()!, configuration.contracts_build_directory);
    const files: string[] = [];

    if (!fs.pathExistsSync(buildDir)) {
      throw new Error(Constants.errorMessageStrings.BuildContractsDirIsNotExist(buildDir));
    }

    if (solidityFilePath) {
      const contractName = getContractNameBySolidityFile(solidityFilePath);
      files.push(`${contractName}${Constants.contractExtension.json}`);
    } else {
      files.push(...fs.readdirSync(buildDir));
    }

    return files
      .map((file) => path.join(buildDir, file))
      .filter((file) => fs.lstatSync(file).isFile());
  }
}
