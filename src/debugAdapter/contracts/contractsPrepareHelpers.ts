import { DebugNetwork } from '../debugNetwork';
import { sortFilePaths } from '../helpers';
import { IContractJsonModel } from '../models/IContractJsonModel';
import { IContractModel } from '../models/IContractModel';
import { Web3Wrapper } from '../web3Wrapper';
import { ContractJsonsProvider } from './contractJsonsProvider';

export async function prepareContracts(workingDirectory: any) {
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
  const contracts = contractJsonValues.map((contractJson) =>
    (mapToContractModel(contractJson, debugNetworkId)));

  const onlyUniqueElements = (value: any, index: number, self: any[]) => (self.indexOf(value) === index);
  const uniqueSourcePaths = contractJsonValues
    .map((contractJson) => (contractJson.sourcePath))
    .filter(onlyUniqueElements);
  const sortedSourcePaths = sortFilePaths(uniqueSourcePaths);

  return {
    contracts,
    files: sortedSourcePaths,
    provider,
  };
}

export function filterContractsWithAddress(contracts: IContractModel[]): IContractModel[] {
  return contracts.filter((c) => c.address);
}

function mapToContractModel(contractJson: IContractJsonModel, networkId: number) {
  return {
    address: contractJson.networks[networkId]
      && contractJson.networks[networkId].address,
    binary: contractJson.bytecode,
    deployedBinary: contractJson.deployedBytecode,
    ...contractJson,
  } as IContractModel;
}
