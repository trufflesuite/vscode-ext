// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {DebugNetwork} from '../debugNetwork';
import {sortFilePaths} from '../helpers';
import {IContractJsonModel} from '../models/IContractJsonModel';
import {IContractModel} from '../models/IContractModel';
import {Web3Wrapper} from '../web3Wrapper';
import {ContractJsonsProvider} from './contractJsonsProvider';
import path from 'path';
import fs from 'fs';
export type ContractData = {
  contracts: Array<any>;
  files: Array<string>;
  provider: any;
  resolved: Array<any>;
  lookupMap: Map<string, string>;
};

export async function prepareContracts(workingDirectory: any): Promise<ContractData> {
  // TODO, the same code in the debuggerCommands.ts, do refactoring
  const debugNetwork = new DebugNetwork(workingDirectory);
  await debugNetwork.load();
  const contractBuildDir = debugNetwork.getTruffleConfiguration()!.contracts_build_directory;
  const debugNetworkOptions = debugNetwork.getNetwork()!.options;
  const web3 = new Web3Wrapper(debugNetworkOptions);
  const provider = web3.getProvider();
  const debugNetworkId = await web3.getNetworkId();

  const contractBuildsProvider = new ContractJsonsProvider(contractBuildDir);
  const contractJsons = await contractBuildsProvider.getJsonsContents();
  const contractJsonValues = Object.values(contractJsons);
  const contracts = contractJsonValues.map((contractJson) => mapToContractModel(contractJson, debugNetworkId));

  const onlyUniqueElements = (value: any, index: number, self: any[]) => self.indexOf(value) === index;
  const uniqueSourcePaths = contractJsonValues
    .map((contractJson) => contractJson.sourcePath)
    .filter(onlyUniqueElements);
  const sortedSourcePaths = sortFilePaths(uniqueSourcePaths);

  // our adapted one. will output the actual directory of the file v's the vanity URL/FilePath
  const r = new NPMExtendedResolver(workingDirectory);
  const resolved: SourceResolution[] = await Promise.all(
    sortedSourcePaths.map(async (path: string) => await r.resolve(path, workingDirectory))
  );
  // only way to filter out undefined values, can't use the map/reduce functions on collections as TS parser isn't clever enough.
  const lookupMap = new Map<string, string>();
  for (const r of resolved) {
    if (r.body && r.filePath && r.absPath) {
      lookupMap.set(r.filePath, r.absPath);
    }
  }

  return {
    contracts,
    files: sortedSourcePaths,
    provider,
    resolved,
    lookupMap,
  };
}

export function filterContractsWithAddress(contracts: IContractModel[]): IContractModel[] {
  return contracts.filter((c) => c.address);
}

function mapToContractModel(contractJson: IContractJsonModel, networkId: number) {
  return {
    address: contractJson.networks[networkId] && contractJson.networks[networkId].address,
    binary: contractJson.bytecode,
    deployedBinary: contractJson.deployedBytecode,
    ...contractJson,
  } as IContractModel;
}

export interface SourceResolution {
  body: string | undefined;
  filePath: string | undefined;
  absPath: string | undefined;
}
export class NPMExtendedResolver {
  workingDirectory: string;

  constructor(workingDirectory: string) {
    this.workingDirectory = workingDirectory;
  }

  // require(importPath: string, searchPath: string) {
  //   if (importPath.indexOf(".") === 0 || importPath.indexOf("/") === 0) {
  //     return null;
  //   }
  //   const contractName = path.basename(importPath, ".sol");
  //   const regex = new RegExp(`(.*)/${contractName}`);
  //   let packageName = "";
  //   const matched = regex.exec(importPath);
  //   if (matched) {
  //     packageName = matched[1];
  //   }
  //   // during testing a temp dir is passed as search path - we need to check the
  //   // working dir in case a built contract was not copied over to it
  //   for (const basePath of [searchPath, this.workingDirectory]) {
  //     if (!basePath) {
  //       continue;
  //     }
  //     const result = this.resolveAndParse(basePath, packageName, contractName);
  //     // result is null if it fails to resolve
  //     if (result) {
  //       return result;
  //     }
  //     continue;
  //   }
  //   return null;
  // }

  async resolve(import_path: string, _imported_from: string): Promise<SourceResolution> {
    // If nothing's found, body returns `undefined`
    var body: string | undefined;
    var modulesDir = this.workingDirectory;
    var expected_path: string | undefined;

    while (true) {
      expected_path = path.join(modulesDir, 'node_modules', import_path);

      try {
        body = fs.readFileSync(expected_path, {encoding: 'utf8'});
        break;
      } catch (err) {
        // do nothing I guess...
      }

      // Recurse outwards until impossible
      var oldModulesDir = modulesDir;
      modulesDir = path.join(modulesDir, '..');
      if (modulesDir === oldModulesDir) {
        break;
      }
    }
    return {body, filePath: import_path, absPath: expected_path};
  }

  // resolveAndParse(basePath: string, packageName: string, contractName: string) {
  //   const packagePath = path.join(basePath, "node_modules", packageName);
  //   const subDirs = [`build${path.sep}contracts`, "build"];
  //   for (const subDir of subDirs) {
  //     const possiblePath = path.join(
  //       packagePath,
  //       subDir,
  //       `${contractName}.json`
  //     );
  //     try {
  //       const result = fs.readFileSync(possiblePath, "utf8");
  //       return JSON.parse(result);
  //     } catch (e) {
  //       continue;
  //     }
  //   }
  //   return null;
  // }

  // We're resolving package paths to other package paths, not absolute paths.
  // This will ensure the source fetcher conintues to use the correct sources for packages.
  // i.e., if some_module/contracts/MyContract.sol imported "./AnotherContract.sol",
  // we're going to resolve it to some_module/contracts/AnotherContract.sol, ensuring
  // that when this path is evaluated this source is used again.
  // resolveDependencyPath(importPath: string, dependencyPath: string) {
  //   if (
  //     !(dependencyPath.startsWith("./") || dependencyPath.startsWith("../"))
  //   ) {
  //     //if it's *not* a relative path, return it unchanged
  //     return dependencyPath;
  //   }
  //   var dirname = path.dirname(importPath);
  //   return path.join(dirname, dependencyPath);
  // }
}
