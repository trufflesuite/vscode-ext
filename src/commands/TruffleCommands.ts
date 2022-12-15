// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {INetwork} from '@/helpers/ConfigurationReader';
import {TruffleConfig} from '@/helpers/TruffleConfiguration';
import {mnemonicToSeed} from 'bip39';
import fs from 'fs-extra';
import hdkey from 'hdkey';
import path from 'path';
import {QuickPickItem, Uri, window, commands, QuickPickItemKind} from 'vscode';
import {Constants, RequiredApps} from '@/Constants';
import {outputCommandHelper} from '@/helpers';
import {getTruffleWorkspace} from '@/helpers/workspace';
import {required} from '@/helpers/required';

import {showQuickPick, showConfirmPaidOperationDialog, showIgnorableNotification} from '@/helpers/userInteraction';
import {getPathByPlatform} from '@/helpers/workspace';

import {IDeployDestination, ItemType} from '@/Models';
import {NetworkForContractItem} from '@/Models/QuickPickItems/NetworkForContractItem';
import {LocalProject, TLocalProjectOptions} from '@/Models/TreeItems/LocalProject';
import {InfuraProject} from '@/Models/TreeItems/InfuraProject';
import {LocalService} from '@/Models/TreeItems/LocalService';
import {Project} from '@/Models/TreeItems/Project';
import {Output, OutputLabel} from '@/Output';
import {ContractDB} from '@/services/contract/ContractDB';
import {TreeManager} from '@/services/tree/TreeManager';
import {GanacheService} from '@/services/ganache/GanacheService';
import {DashboardService} from '@/services/dashboard/DashboardService';
import {ContractInstanceWithMetadata} from '@/services/contract/ContractInstanceWithMetadata';
import {ContractService} from '@/services/contract/ContractService';
import {MnemonicRepository} from '@/services/MnemonicRepository';
import {Telemetry} from '@/TelemetryClient';
import {NetworkNodeView} from '@/ViewItems/NetworkNodeView';
import {ServiceCommands} from './ServiceCommands';
import {mapNetworkName} from '@/helpers/telemetry';
import {writeToClipboard} from '@/helpers/vscodeEnvironment';

interface IDeployDestinationItem {
  cmd: () => Promise<void>;
  cwd?: string;
  description?: string;
  detail?: string;
  kind?: QuickPickItemKind;
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
  /**
   * Triggers the Truffle command line compiler using `npx`.
   *
   * @param contractUri if provided, compiles only `contractUri`.
   * @returns
   */
  export async function buildContracts(contractUri?: Uri): Promise<void> {
    Telemetry.sendEvent('TruffleCommands.buildContracts.commandStarted');

    if (!(await required.checkAppsSilent(RequiredApps.truffle))) {
      Telemetry.sendEvent('TruffleCommands.buildContracts.truffleInstallation');
      await required.installTruffle(required.Scope.locally);
      return;
    }

    const truffleWorkspace = await getTruffleWorkspace(contractUri);
    const workspace = truffleWorkspace.workspace;
    const contractDirectory = getPathByPlatform(workspace);
    const args: string[] = [RequiredApps.truffle, 'compile', '--config', truffleWorkspace.truffleConfigName];

    if (contractUri) {
      if (fs.lstatSync(contractUri.fsPath).isFile()) args.push(path.basename(contractUri.fsPath));
    }

    await showIgnorableNotification(Constants.statusBarMessages.buildingContracts, async () => {
      // INFO: THIS IS THE OLD VERSION OF LOGGER USING OUTPUT CHANNELS
      Output.show();

      await outputCommandHelper.executeCommand(contractDirectory, 'npx', args.join(' '));
      void commands.executeCommand('truffle-vscode.views.deployments.refresh');

      Telemetry.sendEvent('TruffleCommands.buildContracts.commandFinished');
    });
  }

  /**
   * Triggers the `migrate` option of the Truffle command line interface
   * using `npx`.
   *
   * @param contractUri FIXME: Is this used?
   */
  export async function deployContracts(contractUri?: Uri) {
    Telemetry.sendEvent('TruffleCommands.deployContracts.commandStarted');

    const truffleWorkspace = await getTruffleWorkspace(contractUri);
    const truffleConfigUri = getPathByPlatform(truffleWorkspace.truffleConfig);

    const deployDestinations = [];
    deployDestinations.push(...getDefaultDeployDestinations(truffleConfigUri));
    deployDestinations.push(
      ...(await getTruffleDeployDestinations(truffleConfigUri, truffleWorkspace.truffleConfigName))
    );
    deployDestinations.push(...(await getTreeDeployDestinations(truffleConfigUri)));

    const uniqueDestinations = removeDuplicateNetworks(deployDestinations);

    const command = await showQuickPick(uniqueDestinations, {
      ignoreFocusOut: true,
      placeHolder: Constants.placeholders.selectDeployDestination,
    });

    Telemetry.sendEvent('TruffleCommands.deployContracts.selectedDestination', {
      url: Telemetry.obfuscate(command.description || ''),
    });
    await command.cmd();
    // notify our deployment view - WHY IS THIS CRASHING
    commands.executeCommand('truffle-vscode.views.deployments.refresh').then(
      () => {
        // do nothing
      },
      (reason) => {
        // ignore
        const outputStr = `Error refreshing view: ${reason}`;
        Output ? Output.outputLine(OutputLabel.truffleForVSCode, outputStr) : console.log(outputStr);
      }
    );
    Telemetry.sendEvent('TruffleCommands.deployContracts.commandFinished');
  }

  export async function writeAbiToBuffer(uri: Uri): Promise<void> {
    Telemetry.sendEvent('TruffleCommands.writeAbiToBuffer.commandStarted');
    const contract = readCompiledContract(uri);

    await writeToClipboard(JSON.stringify(contract[Constants.contract.configuration.properties.abi]));
    Telemetry.sendEvent('TruffleCommands.writeAbiToBuffer.commandFinished');
  }

  export async function writeBytecodeToBuffer(uri: Uri): Promise<void> {
    Telemetry.sendEvent('TruffleCommands.writeBytecodeToBuffer.commandStarted');
    const contract = readCompiledContract(uri);

    await writeToClipboard(contract[Constants.contract.configuration.properties.bytecode]);
    Telemetry.sendEvent('TruffleCommands.writeBytecodeToBuffer.commandFinished');
  }

  export async function writeDeployedBytecodeToBuffer(uri: Uri): Promise<void> {
    Telemetry.sendEvent('TruffleCommands.writeBytecodeToBuffer.commandStarted');

    ensureFileIsContractJson(uri.fsPath);

    const contractInstances = (await ContractDB.getContractInstances(
      path.basename(uri.fsPath, Constants.contract.configuration.extension.json)
    )) as ContractInstanceWithMetadata[];
    const contractInstancesWithNetworkInfo = contractInstances.filter((contractIns) => {
      return contractIns.network.name !== undefined && !!contractIns.provider && !!contractIns.address;
    });

    if (!contractInstancesWithNetworkInfo.length) {
      window.showInformationMessage(Constants.informationMessage.contractNotDeployed);
      return;
    }

    const networkQuickPickItems = contractInstancesWithNetworkInfo.map(
      (contractIns) =>
        new NetworkForContractItem(contractIns.network.name!, contractIns.provider!.host, contractIns.address!)
    );
    const networkItem = await showQuickPick(networkQuickPickItems, {
      placeHolder: 'Select a network',
      ignoreFocusOut: true,
    });

    try {
      const deployedBytecode = await ContractService.getDeployedBytecodeByAddress(
        networkItem.host,
        networkItem.contractAddress
      );

      void window.showInformationMessage(Constants.informationMessage.transactionBytecodeWasCopiedToClipboard);

      await writeToClipboard(deployedBytecode);
    } catch (ex) {
      Telemetry.sendException(ex as Error);
      void window.showErrorMessage(Constants.errorMessageStrings.FetchingDeployedBytecodeIsFailed);
    }

    Telemetry.sendEvent('TruffleCommands.writeBytecodeToBuffer.commandFinished');
  }

  /**
   * Creates a new contract file named `NewContract.sol`.
   *
   * If `folderUri` is provided, the new contract will be created in that folder.
   * It **must** represent a folder URI.
   *
   * Otherwise, it uses {@link getTruffleWorkspace} to select the
   * Truffle workspace to place the new contract.
   *
   * Once the new contract file has been created,
   * the _Contract Explorer_ view will be refreshed.
   *
   * @param folderUri if provided, the `Uri` to place the newly created contract.
   */
  export async function createContract(folderUri?: Uri): Promise<void> {
    let folderPath: string;

    if (folderUri === undefined) {
      const truffleWorkspace = await getTruffleWorkspace();
      try {
        folderPath = await ContractService.getContractsFolderPath(truffleWorkspace);
      } catch (err) {
        folderPath = path.join(getPathByPlatform(truffleWorkspace.workspace), 'contracts');
      }
    } else {
      folderPath = getPathByPlatform(folderUri);
    }

    await fs.createFile(path.join(folderPath, 'NewContract.sol'));

    await commands.executeCommand('truffle-vscode.views.explorer.refreshExplorer');
  }

  export async function writeRPCEndpointAddressToBuffer(networkNodeView: NetworkNodeView): Promise<void> {
    Telemetry.sendEvent('TruffleCommands.writeRPCEndpointAddressToBuffer.commandStarted');
    try {
      const rpcEndpointAddress = await networkNodeView.extensionItem.getRPCAddress();
      Telemetry.sendEvent('TruffleCommands.writeRPCEndpointAddressToBuffer.getRPCAddress', {
        data: Telemetry.obfuscate(rpcEndpointAddress),
      });

      if (rpcEndpointAddress) {
        await writeToClipboard(rpcEndpointAddress);
        void window.showInformationMessage(Constants.informationMessage.rpcEndpointCopiedToClipboard);
      } else {
        void window.showInformationMessage(
          Constants.informationMessage.networkIsNotReady(networkNodeView.extensionItem.constructor.name)
        );
      }
    } catch (error) {
      Telemetry.sendException(error as Error);
      void window.showErrorMessage(
        Constants.errorMessageStrings.BlockchainItemIsUnavailable(networkNodeView.extensionItem.constructor.name)
      );
    }
  }

  export async function getPrivateKeyFromMnemonic(): Promise<void> {
    Telemetry.sendEvent('TruffleCommands.getPrivateKeyFromMnemonic.commandStarted');
    const mnemonicItems: IExtendedQuickPickItem[] = MnemonicRepository.getExistedMnemonicPaths().map((mnemonicPath) => {
      const savedMnemonic = MnemonicRepository.getMnemonic(mnemonicPath);
      return {
        detail: mnemonicPath,
        extended: savedMnemonic,
        label: MnemonicRepository.MaskMnemonic(savedMnemonic),
      };
    });

    if (mnemonicItems.length === 0) {
      Telemetry.sendEvent('TruffleCommands.getPrivateKeyFromMnemonic.thereAreNoMnemonics');
      void window.showErrorMessage(Constants.errorMessageStrings.ThereAreNoMnemonics);
      return;
    }

    const mnemonicItem = await showQuickPick(mnemonicItems, {
      placeHolder: Constants.placeholders.selectMnemonicExtractKey,
      ignoreFocusOut: true,
    });

    const mnemonic = mnemonicItem.extended;
    if (!mnemonic) {
      Telemetry.sendEvent('TruffleCommands.getPrivateKeyFromMnemonic.mnemonicFileHaveNoText');
      void window.showErrorMessage(Constants.errorMessageStrings.MnemonicFileHaveNoText);
      return;
    }

    try {
      const buffer = await mnemonicToSeed(mnemonic);
      const key = hdkey.fromMasterSeed(buffer);
      const childKey = key.derive("m/44'/60'/0'/0/0");
      const privateKey = childKey.privateKey.toString('hex');
      await writeToClipboard(privateKey);
      void window.showInformationMessage(Constants.informationMessage.privateKeyWasCopiedToClipboard);
    } catch (error) {
      Telemetry.sendException(error as Error);
      void window.showErrorMessage(Constants.errorMessageStrings.InvalidMnemonic);
    }
    Telemetry.sendEvent('TruffleCommands.getPrivateKeyFromMnemonic.commandFinished');
  }
}

function removeDuplicateNetworks(deployDestinations: IDeployDestinationItem[]): IDeployDestinationItem[] {
  return deployDestinations.filter((destination, index, destinations) => {
    return destinations.findIndex((dest) => dest.label === destination.label) === index;
  });
}

async function installRequiredDependencies(): Promise<void> {
  if (!(await required.checkAppsSilent(RequiredApps.truffle))) {
    Telemetry.sendEvent('TruffleCommands.installRequiredDependencies.installTruffle');
    await required.installTruffle(required.Scope.locally);
  }

  if ((await required.isHdWalletProviderRequired()) && !(await required.checkHdWalletProviderVersion())) {
    if (!(await required.isDefaultProject())) {
      const {cancelButton, installButton, requiresDependency} = Constants.informationMessage;
      const answer = await window.showInformationMessage(requiresDependency, installButton, cancelButton);

      if (answer !== installButton) {
        return;
      }
    }

    Telemetry.sendEvent('TruffleCommands.installRequiredDependencies.installTruffleHdWalletProvider');
    await required.installTruffleHdWalletProvider();
  }
}

function getDefaultDeployDestinations(truffleConfigPath: string): IDeployDestinationItem[] {
  return [
    {
      cmd: async () => {
        return;
      },
      kind: QuickPickItemKind.Separator,
      label: Constants.uiCommandSeparators.optionSeparator,
      networkId: '',
    },
    {
      cmd: createNewDeploymentService.bind(undefined, truffleConfigPath),
      label: Constants.uiCommandStrings.createProject,
      detail: Constants.uiCommandStrings.createProjectDetail,
      networkId: '*',
    },
    {
      cmd: deployToDashboard.bind(undefined, truffleConfigPath),
      label: Constants.uiCommandStrings.deployViaTruffleDashboard,
      detail: Constants.uiCommandStrings.deployViaTruffleDashboardDetail,
      networkId: '*',
    },
    {
      cmd: async () => {
        return;
      },
      kind: QuickPickItemKind.Separator,
      label: Constants.uiCommandSeparators.networkSeparator,
      networkId: '',
    },
  ];
}

async function getTruffleDeployDestinations(
  truffleConfigPath: string,
  name: string
): Promise<IDeployDestinationItem[]> {
  const deployDestination: IDeployDestinationItem[] = [];
  const truffleConfig = new TruffleConfig(truffleConfigPath);
  const networksFromConfig = truffleConfig.getNetworks();

  for (const network of networksFromConfig) {
    const options = network.options;
    const url =
      `${options.provider ? options.provider.url : ''}` ||
      `${options.host ? options.host : ''}${options.port ? ':' + options.port : ''}`;

    deployDestination.push({
      cmd: await getTruffleDeployFunction(network.name, truffleConfigPath, network.options.network_id, options.port),
      cwd: path.dirname(truffleConfigPath),
      description: url,
      detail: `From ${name}`,
      label: network.name,
      networkId: options.network_id,
    });
  }

  return deployDestination;
}

async function getTreeDeployDestinations(truffleConfigPath: string): Promise<IDeployDestinationItem[]> {
  const services = TreeManager.getItems();

  const projects = services.reduce((res, service) => {
    res.push(...(service.getChildren() as Project[]));
    return res;
  }, [] as Project[]);

  return getProjectDeployDestinationItems(projects, truffleConfigPath);
}

async function getProjectDeployDestinationItems(
  projects: Project[],
  truffleConfigPath: string
): Promise<IDeployDestinationItem[]> {
  const destinations: IDeployDestination[] = [];

  const filteredProjects = projects.filter(
    (project) => project instanceof InfuraProject || project instanceof LocalProject
  );

  for (const project of filteredProjects) {
    const projectDestinations = await project.getDeployDestinations();
    destinations.push(...projectDestinations);
  }

  return destinations.map((destination) => {
    const {description, detail, getTruffleNetwork, label, networkId, networkType, port} = destination;

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
  port?: number
): Promise<() => Promise<void>> {
  const projects = await getTreeProjects();
  const project = projects.find((project) => project.label === name);

  if (port !== undefined && (project !== undefined || name === Constants.localhostName)) {
    Telemetry.sendEvent('TruffleCommands.getTruffleDeployFunction.returnDeployToLocalGanache');
    return deployToLocalGanache.bind(undefined, name, truffleConfigPath, port, project?.options);
  }
  // 1 - is the marker of main network
  if (networkId === 1 || networkId === '1') {
    Telemetry.sendEvent('TruffleCommands.getTruffleDeployFunction.returnDeployToMainNetwork');
    return deployToMainNetwork.bind(undefined, name, truffleConfigPath);
  }

  Telemetry.sendEvent('TruffleCommands.getTruffleDeployFunction.returnDeployToNetwork');
  return deployToNetwork.bind(undefined, name, truffleConfigPath);
}

async function getTreeProjects(): Promise<IDeployDestination[]> {
  const services = TreeManager.getItems();

  const localService = services.find((service) => service instanceof LocalService);
  const projects = (localService ? localService.getChildren() : []) as LocalProject[];

  const deployDestinations: IDeployDestination[] = [];

  for (const project of projects) {
    const projectDestinations = await project.getDeployDestinations();
    deployDestinations.push(...projectDestinations);
  }

  return deployDestinations;
}

function getServiceCreateFunction(
  type: ItemType,
  getTruffleNetwork: () => Promise<INetwork>,
  truffleConfigPath: string,
  port?: number
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

  const command = await showQuickPick(deployDestination, {
    ignoreFocusOut: true,
    placeHolder: Constants.placeholders.selectDeployDestination,
  });

  Telemetry.sendEvent('TruffleCommands.deployContracts.createNewDeploymentService.selectedDestination', {
    url: Telemetry.obfuscate(command.description || ''),
  });

  await command.cmd();
}

async function createLocalGanacheNetwork(
  getTruffleNetwork: () => Promise<INetwork>,
  truffleConfigPath: string,
  port: number
): Promise<void> {
  await GanacheService.startGanacheServer(port);
  await createNetwork(getTruffleNetwork, truffleConfigPath);
}

async function createNetwork(getTruffleNetwork: () => Promise<INetwork>, truffleConfigPath: string): Promise<void> {
  const network = await getTruffleNetwork();
  const truffleConfig = new TruffleConfig(truffleConfigPath);
  truffleConfig.setNetworks(network);

  await deployToNetwork(network.name, truffleConfigPath);
}

async function deployToNetwork(networkName: string, truffleConfigPath: string): Promise<void> {
  await showIgnorableNotification(Constants.statusBarMessages.deployingContracts(networkName), async () => {
    const workspaceRoot = path.dirname(truffleConfigPath);
    const truffleConfigName = path.basename(truffleConfigPath);
    await fs.ensureDir(workspaceRoot);

    // INFO: THIS IS THE OLD VERSION OF LOGGER USING OUTPUT CHANNELS
    Output.show();

    try {
      await installRequiredDependencies();
      await outputCommandHelper.executeCommand(
        workspaceRoot,
        'npx',
        RequiredApps.truffle,
        'migrate',
        '--reset',
        '--compile-all',
        '--network',
        networkName,
        '--config',
        truffleConfigName
      );

      Output.outputLine(OutputLabel.truffleForVSCode, Constants.informationMessage.deploySucceeded);
      Telemetry.sendEvent('TruffleCommands.deployToNetwork.deployedSuccessfully', {
        destination: mapNetworkName(networkName),
      });
    } catch (error) {
      Output.outputLine(OutputLabel.truffleForVSCode, Constants.informationMessage.deployFailed);
      Telemetry.sendEvent('TruffleCommands.deployToNetwork.deployedFailed', {
        destination: mapNetworkName(networkName),
      });
      throw error;
    }

    await ContractDB.updateContracts();
  });
}

async function deployToLocalGanache(
  networkName: string,
  truffleConfigPath: string,
  port: number,
  options?: TLocalProjectOptions
): Promise<void> {
  await GanacheService.startGanacheServer(port, options);
  await deployToNetwork(networkName, truffleConfigPath);
}

async function deployToMainNetwork(networkName: string, truffleConfigPath: string): Promise<void> {
  await showConfirmPaidOperationDialog();
  await deployToNetwork(networkName, truffleConfigPath);
}

async function deployToDashboard(truffleConfigPath: string): Promise<void> {
  await DashboardService.startDashboardServer(Constants.dashboardPort);
  await deployToNetwork(RequiredApps.dashboard, truffleConfigPath);
}

function readCompiledContract(uri: Uri): any {
  ensureFileIsContractJson(uri.fsPath);
  const data = fs.readFileSync(uri.fsPath, null);

  return JSON.parse(data.toString());
}

function ensureFileIsContractJson(filePath: string) {
  if (path.extname(filePath) !== Constants.contract.configuration.extension.json) {
    const error = new Error(Constants.errorMessageStrings.InvalidContract);
    Telemetry.sendException(error);
    throw error;
  }
}
