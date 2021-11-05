// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as bip39 from 'bip39';
import * as fs from 'fs-extra';
// @ts-ignore
import * as hdkey from 'hdkey';
import * as path from 'path';
import { QuickPickItem, Uri, window } from 'vscode';
import { Constants, RequiredApps } from '../Constants';
import {
  getWorkspaceRoot,
  openZeppelinHelper,
  outputCommandHelper,
  required,
  showConfirmPaidOperationDialog,
  showIgnorableNotification,
  showQuickPick,
  telemetryHelper,
  TruffleConfig,
  TruffleConfiguration,
  vscodeEnvironment,
} from '../helpers';
import { IDeployDestination, ItemType } from '../Models';
import { NetworkForContractItem } from '../Models/QuickPickItems/NetworkForContractItem';
import { AzureBlockchainProject, InfuraProject, LocalProject, LocalService } from '../Models/TreeItems';
import { Project } from '../Models/TreeItems';
import { Output } from '../Output';
import {
  ContractDB,
  ContractInstanceWithMetadata,
  ContractService,
  GanacheService,
  MnemonicRepository,
  OpenZeppelinService,
  TreeManager,
} from '../services';
import { OZContractValidated } from '../services/openZeppelin/models';
import { Telemetry } from '../TelemetryClient';
import { NetworkNodeView } from '../ViewItems';
import { ServiceCommands } from './ServiceCommands';

interface IDeployDestinationItem {
  cmd: () => Promise<void>;
  cwd?: string;
  description?: string;
  detail?: string;
  label: string;
  networkId: string | number;
}

interface IExtendedQuickPickItem extends QuickPickItem {
  /**
   * Additional field for storing non-displayed information
   */
  extended: string;
}

export namespace TruffleCommands {
  export async function buildContracts(): Promise<void> {
    Telemetry.sendEvent('TruffleCommands.buildContracts.commandStarted');
    await showIgnorableNotification(
      Constants.statusBarMessages.buildingContracts,
      async () => {
        if (!await required.checkAppsSilent(RequiredApps.truffle)) {
          Telemetry.sendEvent('TruffleCommands.buildContracts.truffleInstallation');
          await required.installTruffle(required.Scope.locally);
        }

        await outputCommandHelper.executeCommand(getWorkspaceRoot(), 'npx', RequiredApps.truffle, 'compile');
      },
    );

    Telemetry.sendEvent('TruffleCommands.buildContracts.commandFinished');
  }

  export async function deployContracts(): Promise<void> {
    Telemetry.sendEvent('TruffleCommands.deployContracts.commandStarted');

    await checkOpenZeppelinIfUsed();

    const truffleConfigsUri = TruffleConfiguration.getTruffleConfigUri();
    const defaultDeployDestinations = getDefaultDeployDestinations(truffleConfigsUri);
    const truffleDeployDestinations = await getTruffleDeployDestinations(truffleConfigsUri);
    const treeDeployDestinations = await getTreeDeployDestinations(truffleConfigsUri);

    const deployDestinations: IDeployDestinationItem[] = [];
    deployDestinations.push(...defaultDeployDestinations);
    deployDestinations.push(...truffleDeployDestinations);
    deployDestinations.push(...treeDeployDestinations);

    const uniqueDestinations = removeDuplicateNetworks(deployDestinations);

    const command = await showQuickPick(
      uniqueDestinations,
      {
        ignoreFocusOut: true,
        placeHolder: Constants.placeholders.selectDeployDestination,
      },
    );

    Telemetry.sendEvent(
      'TruffleCommands.deployContracts.selectedDestination',
      { url: Telemetry.obfuscate(command.description || '') },
    );

    await command.cmd();

    Telemetry.sendEvent('TruffleCommands.deployContracts.commandFinished');
  }

  export async function writeAbiToBuffer(uri: Uri): Promise<void> {
    Telemetry.sendEvent('TruffleCommands.writeAbiToBuffer.commandStarted');
    const contract = await readCompiledContract(uri);

    await vscodeEnvironment.writeToClipboard(JSON.stringify(contract[Constants.contractProperties.abi]));
    Telemetry.sendEvent('TruffleCommands.writeAbiToBuffer.commandFinished');
  }

  export async function writeBytecodeToBuffer(uri: Uri): Promise<void> {
    Telemetry.sendEvent('TruffleCommands.writeBytecodeToBuffer.commandStarted');
    const contract = await readCompiledContract(uri);

    await vscodeEnvironment.writeToClipboard(contract[Constants.contractProperties.bytecode]);
    Telemetry.sendEvent('TruffleCommands.writeBytecodeToBuffer.commandFinished');
  }

  export async function writeDeployedBytecodeToBuffer(uri: Uri): Promise<void> {
    Telemetry.sendEvent('TruffleCommands.writeBytecodeToBuffer.commandStarted');

    ensureFileIsContractJson(uri.fsPath);

    const contractInstances = await ContractDB.getContractInstances(
      path.basename(uri.fsPath, Constants.contractExtension.json)) as ContractInstanceWithMetadata[];
    const contractInstancesWithNetworkInfo = contractInstances.filter((contractIns) => {
      return contractIns.network.name !== undefined && !!contractIns.provider && !!contractIns.address;
    });

    if (!contractInstancesWithNetworkInfo.length) {
      window.showInformationMessage(Constants.informationMessage.contractNotDeployed);
      return;
    }

    const networkQuickPickItems = contractInstancesWithNetworkInfo.map((contractIns) =>
      new NetworkForContractItem(contractIns.network.name!, contractIns.provider!.host, contractIns.address!));
    const networkItem = await showQuickPick(
      networkQuickPickItems,
      { placeHolder: 'Select a network', ignoreFocusOut: true },
    );

    try {
      const deployedBytecode =
        await ContractService.getDeployedBytecodeByAddress(networkItem.host, networkItem.contractAddress);

      window.showInformationMessage(Constants.informationMessage.transactionBytecodeWasCopiedToClipboard);

      await vscodeEnvironment.writeToClipboard(deployedBytecode);
    } catch (ex) {
      Telemetry.sendException(ex as Error);
      window.showErrorMessage(Constants.errorMessageStrings.FetchingDeployedBytecodeIsFailed);
    }

    Telemetry.sendEvent('TruffleCommands.writeBytecodeToBuffer.commandFinished');
  }

  export async function writeRPCEndpointAddressToBuffer(networkNodeView: NetworkNodeView): Promise<void> {
    Telemetry.sendEvent('TruffleCommands.writeRPCEndpointAddressToBuffer.commandStarted');
    try {
      const rpcEndpointAddress = await networkNodeView.extensionItem.getRPCAddress();
      Telemetry.sendEvent('TruffleCommands.writeRPCEndpointAddressToBuffer.getRPCAddress',
        { data: Telemetry.obfuscate(rpcEndpointAddress) },
      );

      if (rpcEndpointAddress) {
        await vscodeEnvironment.writeToClipboard(rpcEndpointAddress);
        window.showInformationMessage(Constants.informationMessage.rpcEndpointCopiedToClipboard);
      } else {
        window.showInformationMessage(
          Constants.informationMessage.networkIsNotReady(networkNodeView.extensionItem.constructor.name));
      }
    } catch (error) {
      Telemetry.sendException(error as Error);
      window.showErrorMessage(Constants.errorMessageStrings.BlockchainItemIsUnavailable(
        networkNodeView.extensionItem.constructor.name));
    }
  }

  export async function getPrivateKeyFromMnemonic(): Promise<void> {
    Telemetry.sendEvent('TruffleCommands.getPrivateKeyFromMnemonic.commandStarted');
    const mnemonicItems: IExtendedQuickPickItem[] = MnemonicRepository
      .getExistedMnemonicPaths()
      .map((mnemonicPath) => {
        const savedMnemonic = MnemonicRepository.getMnemonic(mnemonicPath);
        return {
          detail: mnemonicPath,
          extended: savedMnemonic,
          label: MnemonicRepository.MaskMnemonic(savedMnemonic),
        };
      });

    if (mnemonicItems.length === 0) {
      Telemetry.sendEvent('TruffleCommands.getPrivateKeyFromMnemonic.thereAreNoMnemonics');
      window.showErrorMessage(Constants.errorMessageStrings.ThereAreNoMnemonics);
      return;
    }

    const mnemonicItem = await showQuickPick(
      mnemonicItems,
      { placeHolder: Constants.placeholders.selectMnemonicExtractKey, ignoreFocusOut: true },
    );

    const mnemonic = mnemonicItem.extended;
    if (!mnemonic) {
      Telemetry.sendEvent('TruffleCommands.getPrivateKeyFromMnemonic.mnemonicFileHaveNoText');
      window.showErrorMessage(Constants.errorMessageStrings.MnemonicFileHaveNoText);
      return;
    }

    try {
      const buffer = await bip39.mnemonicToSeed(mnemonic);
      const key = hdkey.fromMasterSeed(buffer);
      const childKey = key.derive('m/44\'/60\'/0\'/0/0');
      const privateKey = childKey.privateKey.toString('hex');
      await vscodeEnvironment.writeToClipboard(privateKey);
      window.showInformationMessage(Constants.informationMessage.privateKeyWasCopiedToClipboard);
    } catch (error) {
      Telemetry.sendException(error as Error);
      window.showErrorMessage(Constants.errorMessageStrings.InvalidMnemonic);
    }
    Telemetry.sendEvent('TruffleCommands.getPrivateKeyFromMnemonic.commandFinished');
  }
}

async function checkOpenZeppelinIfUsed(): Promise<void> {
  if (OpenZeppelinService.projectJsonExists()) {
    if (await openZeppelinHelper.shouldUpgradeOpenZeppelinAsync()) {
      await openZeppelinHelper.upgradeOpenZeppelinContractsAsync();
      await openZeppelinHelper.upgradeOpenZeppelinUserSettingsAsync();
    }

    await validateOpenZeppelinContracts();
    await openZeppelinHelper.defineContractRequiredParameters();
  }
}

function removeDuplicateNetworks(deployDestinations: IDeployDestinationItem[]): IDeployDestinationItem[] {
  return deployDestinations.filter((destination, index, destinations) => {
    return destinations.findIndex((dest) => dest.label === destination.label) === index;
  });
}

async function installRequiredDependencies(): Promise<void> {
  if (!await required.checkAppsSilent(RequiredApps.truffle)) {
    Telemetry.sendEvent('TruffleCommands.installRequiredDependencies.installTruffle');
    await required.installTruffle(required.Scope.locally);
  }

  if (await required.isHdWalletProviderRequired() && !(await required.checkHdWalletProviderVersion())) {

    if (!await required.isDefaultProject()) {
      const { cancelButton, installButton, requiresDependency } = Constants.informationMessage;
      const answer = await window.showInformationMessage(requiresDependency, installButton, cancelButton);

      if (answer !== installButton) {
        return;
      }
    }

    Telemetry.sendEvent('TruffleCommands.installRequiredDependencies.installTruffleHdWalletProvider');
    await required.installTruffleHdWalletProvider();
  }
}

async function validateOpenZeppelinContracts(): Promise<void> {
  const validatedContracts = await OpenZeppelinService.validateContractsAsync();
  validatedContracts.forEach((ozContract: OZContractValidated) => {
    if (ozContract.isExistedOnDisk) {
      Output.outputLine('', ozContract.isHashValid
        ? Constants.openZeppelin.validHashMessage(ozContract.contractPath)
        : Constants.openZeppelin.invalidHashMessage(ozContract.contractPath));
    } else {
      Output.outputLine('', Constants.openZeppelin.contractNotExistedOnDisk(ozContract.contractPath));
    }
  });

  const invalidContractsPaths = validatedContracts
    .filter((ozContract: OZContractValidated) => !ozContract.isExistedOnDisk || !ozContract.isHashValid)
    .map((ozContract: OZContractValidated) => ozContract.contractPath);

  if (invalidContractsPaths.length !== 0) {
    const errorMsg = Constants.validationMessages.openZeppelinFilesAreInvalid(invalidContractsPaths);
    const error = new Error(errorMsg);
    window.showErrorMessage(errorMsg);
    const obfuscatedPaths = invalidContractsPaths.map((invalidContractsPath) =>
      Telemetry.obfuscate(invalidContractsPath));
    Telemetry.sendException(new Error(Constants.validationMessages.openZeppelinFilesAreInvalid(obfuscatedPaths)));
    throw error;
  }
}

function getDefaultDeployDestinations(truffleConfigPath: string): IDeployDestinationItem[] {
  return [
    {
      cmd: createNewDeploymentService.bind(undefined, truffleConfigPath),
      label: Constants.uiCommandStrings.createProject,
      networkId: '*',
    },
  ];
}

async function getTruffleDeployDestinations(truffleConfigPath: string): Promise<IDeployDestinationItem[]> {
  const deployDestination: IDeployDestinationItem[] = [];
  const truffleConfig = new TruffleConfig(truffleConfigPath);
  const networksFromConfig = truffleConfig.getNetworks();

  networksFromConfig.forEach(async (network: TruffleConfiguration.INetwork) => {
    const options = network.options;
    const url = `${options.provider ? options.provider.url : ''}` ||
      `${options.host ? options.host : ''}${options.port ? ':' + options.port : ''}`;

    deployDestination.push({
      cmd: await getTruffleDeployFunction(
        network.name,
        truffleConfigPath,
        network.options.network_id,
        options.port),
      cwd: path.dirname(truffleConfigPath),
      description: url,
      detail: 'From truffle-config.js',
      label: network.name,
      networkId: options.network_id,
    });
  });

  return deployDestination;
}

async function getTreeDeployDestinations(truffleConfigPath: string): Promise<IDeployDestinationItem[]> {
  const services = TreeManager.getItems();

  const projects = services.reduce((res, service) => {
    res.push(...service.getChildren() as Project[]);
    return res;
  }, [] as Project[]);

  return getProjectDeployDestinationItems(projects, truffleConfigPath);
}

async function getProjectDeployDestinationItems(projects: Project[], truffleConfigPath: string)
: Promise<IDeployDestinationItem[]> {
  const destinations: IDeployDestination[] = [];

  const filteredProjects = projects.filter((project) =>
    project instanceof AzureBlockchainProject ||
    project instanceof InfuraProject ||
    project instanceof LocalProject);

  for (const project of filteredProjects) {
    const projectDestinations = await project.getDeployDestinations();
    destinations.push(...projectDestinations);
  }

  return destinations.map((destination) => {
    const { description, detail, getTruffleNetwork, label, networkId, networkType, port } = destination;

    return {
      cmd: getServiceCreateFunction(networkType, getTruffleNetwork, truffleConfigPath, port),
      description,
      detail,
      label,
      networkId,
    } as IDeployDestinationItem;
  });
}

async function getTruffleDeployFunction(
  name: string,
  truffleConfigPath: string,
  networkId: number | string,
  port?: number)
  : Promise<() => Promise<void>> {
  const treeProjectNames = await getTreeProjectNames();
  if (port !== undefined && (treeProjectNames.includes(name) || name === Constants.localhostName)) {
    Telemetry.sendEvent('TruffleCommands.getTruffleDeployFunction.returnDeployToLocalGanache');
    return deployToLocalGanache.bind(undefined, name, truffleConfigPath, port);
  }
  // 1 - is the marker of main network
  if (networkId === 1 || networkId === '1') {
    Telemetry.sendEvent('TruffleCommands.getTruffleDeployFunction.returnDeployToMainNetwork');
    return deployToMainNetwork.bind(undefined, name, truffleConfigPath);
  }

  Telemetry.sendEvent('TruffleCommands.getTruffleDeployFunction.returnDeployToNetwork');
  return deployToNetwork.bind(undefined, name, truffleConfigPath);
}

async function getTreeProjectNames(): Promise<string[]> {
  const services = TreeManager.getItems();

  const localService = services.find((service) => service instanceof LocalService);
  const projects = (localService ? localService.getChildren() : [])  as  Project[];

  const projectNames = [];

  for (const project of projects) {
    const projectDestinations = await project.getDeployDestinations();
    projectNames.push(...projectDestinations);
  }

  return projectNames.map((destination) => destination.label);
}

function getServiceCreateFunction(
  type: ItemType,
  getTruffleNetwork: () => Promise<TruffleConfiguration.INetwork>,
  truffleConfigPath: string,
  port?: number,
): () => Promise<void> {
  if (type === ItemType.LOCAL_NETWORK_NODE) {
    Telemetry.sendEvent('TruffleCommands.getServiceCreateFunction.returnCreateLocalGanacheNetwork');
    return createLocalGanacheNetwork.bind(undefined, getTruffleNetwork, truffleConfigPath, port!);
  }

  Telemetry.sendEvent('TruffleCommands.getServiceCreateFunction.returnCreateService');
  return createNetwork.bind(undefined, getTruffleNetwork, truffleConfigPath);
}

async function createNewDeploymentService(truffleConfigPath: string): Promise<void> {
  Telemetry.sendEvent('TruffleCommands.createNewDeploymentService.commandStarted');

  const project = await ServiceCommands.createProject();
  const deployDestination = await getProjectDeployDestinationItems([project], truffleConfigPath);

  const command = await showQuickPick(
    deployDestination,
    {
      ignoreFocusOut: true,
      placeHolder: Constants.placeholders.selectDeployDestination,
    },
  );

  Telemetry.sendEvent(
    'TruffleCommands.deployContracts.createNewDeploymentService.selectedDestination',
    { url: Telemetry.obfuscate(command.description || '') },
  );

  await command.cmd();
}

async function createLocalGanacheNetwork(
  getTruffleNetwork: () => Promise<TruffleConfiguration.INetwork>,
  truffleConfigPath: string,
  port: number,
): Promise<void> {
  await GanacheService.startGanacheServer(port);
  await createNetwork(getTruffleNetwork, truffleConfigPath);
}

async function createNetwork(getTruffleNetwork: () => Promise<TruffleConfiguration.INetwork>, truffleConfigPath: string)
: Promise<void> {
  const network = await getTruffleNetwork();
  const truffleConfig = new TruffleConfig(truffleConfigPath);
  truffleConfig.setNetworks(network);

  await deployToNetwork(network.name, truffleConfigPath);
}

async function deployToNetwork(networkName: string, truffleConfigPath: string): Promise<void> {
  await showIgnorableNotification(
    Constants.statusBarMessages.deployingContracts(networkName),
    async () => {
      const workspaceRoot = path.dirname(truffleConfigPath);

      await fs.ensureDir(workspaceRoot);

      try {
        await installRequiredDependencies();
        await outputCommandHelper.executeCommand(
          workspaceRoot,
          'npx',
          RequiredApps.truffle, 'migrate', '--reset', '--network', networkName,
        );
        Output.outputLine(Constants.outputChannel.azureBlockchain, Constants.informationMessage.deploySucceeded);
        Telemetry.sendEvent(
          'TruffleCommands.deployToNetwork.deployedSuccessfully',
          {
            destination: telemetryHelper.mapNetworkName(networkName),
          },
        );
      } catch (error) {
        Output.outputLine(Constants.outputChannel.azureBlockchain, Constants.informationMessage.deployFailed);
        Telemetry.sendEvent(
          'TruffleCommands.deployToNetwork.deployedFailed',
          {
            destination: telemetryHelper.mapNetworkName(networkName),
          },
        );
        throw error;
      }

      await ContractDB.updateContracts();
    },
  );
}

async function deployToLocalGanache(networkName: string, truffleConfigPath: string, port: number): Promise<void> {
  await GanacheService.startGanacheServer(port);
  await deployToNetwork(networkName, truffleConfigPath);
}

async function deployToMainNetwork(networkName: string, truffleConfigPath: string): Promise<void> {
  await showConfirmPaidOperationDialog();

  await deployToNetwork(networkName, truffleConfigPath);
}

async function readCompiledContract(uri: Uri): Promise<any> {
  ensureFileIsContractJson(uri.fsPath);
  const data = fs.readFileSync(uri.fsPath, null);

  return JSON.parse(data.toString());
}

function ensureFileIsContractJson(filePath: string) {
  if (path.extname(filePath) !== Constants.contractExtension.json) {
    const error = new Error(Constants.errorMessageStrings.InvalidContract);
    Telemetry.sendException(error);
    throw error;
  }
}
