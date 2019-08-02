import { DebugNetwork } from '../debugNetwork';
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
  const provider = await web3.getProvider();
  const debugNetworkId = await web3.getNetworkId();

  const contracts: IContractModel[] = [];
  const contractBuildsProvider = new ContractJsonsProvider(contractBuildDir);
  const contractJsons = await contractBuildsProvider.getJsonsContents();
  Object.keys(contractJsons).forEach((fileName) => {
    const contractJson = contractJsons[fileName];
    const contractModel = {
      address: contractJson.networks
        && contractJson.networks[debugNetworkId]
        && contractJson.networks[debugNetworkId].address,
      binary: contractJson.bytecode,
      deployedBinary: contractJson.deployedBytecode,
      ...contractJson,
    } as IContractModel;
    contracts.push(contractModel);
  });

  return {
    contracts,
    provider,
  };
}

export function filterContractsWithAddress(contracts: IContractModel[]): IContractModel[] {
  return contracts.filter((c) => c.address);
}

// Base contracts are not deployed as particular contract that's why they don't have address
export function filterBaseContracts(contracts: IContractModel[]): IContractModel[] {
  return contracts.filter((c) => !c.address);
}
