// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as bip39 from 'bip39';
import * as fs from 'fs-extra';
// @ts-ignore
import * as hdkey from 'hdkey';
import * as path from 'path';
import { ProgressLocation, QuickPickItem, Uri, window } from 'vscode';
import { Constants, RequiredApps } from '../Constants';
import {
  getWorkspaceRoot,
  outputCommandHelper,
  required,
  showConfirmPaidOperationDialog,
  showQuickPick,
  TruffleConfig,
  TruffleConfiguration,
  vscodeEnvironment,
} from '../helpers';
import { IDeployDestination, ItemType } from '../Models';
import { LocalService } from '../Models/TreeItems';
import { Project } from '../Models/TreeItems';
import { Output } from '../Output';
import { ContractDB, GanacheService, MnemonicRepository, OpenZeppelinService, TreeManager } from '../services';
import { OZContractValidated } from '../services/openZeppelin/OpenZeppelinService';
import { Telemetry } from '../TelemetryClient';
import { ProjectView } from '../ViewItems';
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
    await window.withProgress({
      location: ProgressLocation.Window,
      title: Constants.statusBarMessages.buildingContracts,
    }, async () => {
      if (!await required.checkAppsSilent(RequiredApps.truffle)) {
        Telemetry.sendEvent('TruffleCommands.buildContracts.truffleInstallation');
        await required.installTruffle(required.Scope.locally);
      }

      Output.show();
      await outputCommandHelper.executeCommand(getWorkspaceRoot(), 'npx', RequiredApps.truffle, 'compile');
    });
    Telemetry.sendEvent('TruffleCommands.buildContracts.commandFinished');
  }

  export async function deployContracts(): Promise<void> {
    Telemetry.sendEvent('TruffleCommands.deployContracts.commandStarted');

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

    // this code should be below showQuickPick because it takes time and it affects on responsiveness
    if (!await required.checkAppsSilent(RequiredApps.truffle)) {
      Telemetry.sendEvent('TruffleCommands.deployContracts.installTruffle');
      await required.installTruffle(required.Scope.locally);
    }

    if (await required.isHdWalletProviderRequired()
      && !(await required.checkHdWalletProviderVersion())) {
      Telemetry.sendEvent('TruffleCommands.deployContracts.installTruffleHdWalletProvider');
      await required.installTruffleHdWalletProvider();
    }

    await validateOpenZeppelinContracts();

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

  export async function writeRPCEndpointAddressToBuffer(projectView: ProjectView): Promise<void> {
    Telemetry.sendEvent('TruffleCommands.writeRPCEndpointAddressToBuffer.commandStarted');
    const rpcEndpointAddress = await projectView.extensionItem.getRPCAddress();
    Telemetry.sendEvent('TruffleCommands.writeRPCEndpointAddressToBuffer.getRPCAddress',
      { data: Telemetry.obfuscate(rpcEndpointAddress) },
    );

    if (rpcEndpointAddress) {
      await vscodeEnvironment.writeToClipboard(rpcEndpointAddress);
      window.showInformationMessage(Constants.informationMessage.rpcEndpointCopiedToClipboard);
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
      Telemetry.sendException(error);
      window.showErrorMessage(Constants.errorMessageStrings.InvalidMnemonic);
    }
    Telemetry.sendEvent('TruffleCommands.getPrivateKeyFromMnemonic.commandFinished');
  }
}

function removeDuplicateNetworks(deployDestinations: IDeployDestinationItem[]): IDeployDestinationItem[] {
  return deployDestinations.filter((destination, index, destinations) => {
    return destinations.findIndex((dest) => dest.label === destination.label) === index;
  });
}

async function validateOpenZeppelinContracts(): Promise<void> {
  const validatedContracts = await OpenZeppelinService.validateContracts();
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
    Telemetry.sendException(error);
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

  for (const project of projects) {
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
  if (port !== undefined &&
    (treeProjectNames.includes(name) || name === Constants.localhostName)) {
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
  return window.withProgress({
    location: ProgressLocation.Window,
    title: Constants.statusBarMessages.deployingContracts(networkName),
  }, async () => {
    const workspaceRoot = path.dirname(truffleConfigPath);

    await fs.ensureDir(workspaceRoot);
    await outputCommandHelper.executeCommand(
      workspaceRoot,
      'npx',
      RequiredApps.truffle, 'migrate', '--reset', '--network', networkName,
    );

    await ContractDB.updateContracts();
  });
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
  if (path.extname(uri.fsPath) !== Constants.contractExtension.json) {
    const error = new Error(Constants.errorMessageStrings.InvalidContract);
    Telemetry.sendException(error);
    throw error;
  }

  const data = fs.readFileSync(uri.fsPath, null);

  return JSON.parse(data.toString());
}
