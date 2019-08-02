// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

// workaround to load native modules
// (since https://github.com/Microsoft/vscode/issues/658 doesn't work on win10)
import nativeModulesLoader from './debugAdapter/nativeModules/loader';
nativeModulesLoader();

import { commands, ExtensionContext, Uri, window } from 'vscode';
import { ConsortiumCommands } from './commands/ConsortiumCommands';
import { ContractCommands } from './commands/ContractCommands';
import { startSolidityDebugger } from './commands/DebuggerCommands';
import { GanacheCommands } from './commands/GanacheCommands';
import { LogicAppCommands } from './commands/LogicAppCommands';
import { ProjectCommands } from './commands/ProjectCommands';
import { TruffleCommands } from './commands/TruffleCommands';
import { Constants } from './Constants';
import { CommandContext, isWorkspaceOpen, required, setCommandContext } from './helpers';
import { CancellationEvent } from './Models';
import { Output } from './Output';
import { RequirementsPage, WelcomePage } from './pages';
import { AdapterType, ContractDB, GanacheService, MnemonicRepository } from './services';
import { Telemetry } from './TelemetryClient';
import { ConsortiumTree } from './treeService/ConsortiumTree';
import { ConsortiumTreeManager } from './treeService/ConsortiumTreeManager';
import { ConsortiumView } from './ViewItems';

import { DebuggerConfiguration } from './debugAdapter/configuration/debuggerConfiguration';

export async function activate(context: ExtensionContext) {
  Constants.initialize(context);
  MnemonicRepository.initialize(context.globalState);
  DebuggerConfiguration.initialize(context);

  setCommandContext(CommandContext.Enabled, true);
  setCommandContext(CommandContext.IsWorkspaceOpen, isWorkspaceOpen());

  const welcomePage = new WelcomePage(context);
  const requirementsPage = new RequirementsPage(context);
  const consortiumTreeManager = new ConsortiumTreeManager(context);
  const consortiumTree = new ConsortiumTree(consortiumTreeManager);

  await welcomePage.checkAndShow();
  await ContractDB.initialize(AdapterType.IN_MEMORY);
  window.registerTreeDataProvider('AzureBlockchain', consortiumTree);

  //#region azureBlockchain extension commands
  const refresh = commands.registerCommand('azureBlockchainService.refresh', (element) => {
    consortiumTree.refresh(element);
  });
  const showWelcomePage = commands.registerCommand('azureBlockchainService.showWelcomePage', async () => {
    return welcomePage.show();
  });
  const showRequirementsPage = commands.registerCommand('azureBlockchainService.showRequirementsPage',
    async (checkShowOnStartup: boolean) => {
      return checkShowOnStartup ? requirementsPage.checkAndShow() : requirementsPage.show();
    });
  //#endregion

  //#region Ganache extension commands
  const startGanacheServer = commands.registerCommand('azureBlockchainService.startGanacheServer',
    async (viewItem?: ConsortiumView) => {
      await tryExecute(() => GanacheCommands.startGanacheCmd(consortiumTreeManager, viewItem));
    });

  const stopGanacheServer = commands.registerCommand('azureBlockchainService.stopGanacheServer',
    async (viewItem?: ConsortiumView) => {
      await tryExecute(() => GanacheCommands.stopGanacheCmd(consortiumTreeManager, viewItem));
    });
  //#endregion

  //#region truffle commands
  const newSolidityProject = commands.registerCommand('truffle.newSolidityProject', async () => {
    await tryExecute(() => ProjectCommands.newSolidityProject());
  });
  const buildContracts = commands.registerCommand('truffle.buildContracts', async () => {
    await tryExecute(() => TruffleCommands.buildContracts());
  });
  const deployContracts = commands.registerCommand('truffle.deployContracts', async () => {
    await tryExecute(() => TruffleCommands.deployContracts(consortiumTreeManager));
  });
  const copyByteCode = commands.registerCommand('contract.copyByteCode', async (uri: Uri) => {
    await tryExecute(() => TruffleCommands.writeBytecodeToBuffer(uri));
  });
  const copyABI = commands.registerCommand('contract.copyABI', async (uri: Uri) => {
    await tryExecute(() => TruffleCommands.writeAbiToBuffer(uri));
  });
  const copyRPCEndpointAddress = commands.registerCommand('azureBlockchainService.copyRPCEndpointAddress',
    async (viewItem: ConsortiumView) => {
      await tryExecute(() => TruffleCommands.writeRPCEndpointAddressToBuffer(viewItem));
    });
  const getPrivateKeyFromMnemonic = commands.registerCommand('azureBlockchainService.getPrivateKey', async () => {
    await tryExecute(() => TruffleCommands.getPrivateKeyFromMnemonic());
  });
  //#endregion

  //#region commands with dialog
  const createConsortium = commands.registerCommand('azureBlockchainService.createConsortium', async () => {
    await tryExecute(() => ConsortiumCommands.createConsortium(consortiumTreeManager));
  });
  const connectConsortium = commands.registerCommand('azureBlockchainService.connectConsortium', async () => {
    await tryExecute(() => ConsortiumCommands.connectConsortium(consortiumTreeManager));
  });
  const disconnectConsortium = commands.registerCommand('azureBlockchainService.disconnectConsortium',
    async (viewItem: ConsortiumView) => {
      await tryExecute(() => ConsortiumCommands.disconnectConsortium(consortiumTreeManager, viewItem));
    });
  //#endregion

  //#region contract commands
  const showSmartContractPage = commands.registerCommand(
    'azureBlockchainService.showSmartContractPage',
    async (contractPath: Uri) => {
      await tryExecute(() => ContractCommands.showSmartContractPage(context, contractPath));
    });
  //#endregion

  //#region logic app commands
  const generateMicroservicesWorkflows = commands.registerCommand(
    'azureBlockchainService.generateMicroservicesWorkflows',
    async (filePath: Uri | undefined) => {
      await tryExecute(() => LogicAppCommands.generateMicroservicesWorkflows(filePath));
    });
  const generateDataPublishingWorkflows = commands.registerCommand(
    'azureBlockchainService.generateDataPublishingWorkflows',
    async (filePath: Uri | undefined) => {
      await tryExecute(() => LogicAppCommands.generateDataPublishingWorkflows(filePath));
    });
  const generateEventPublishingWorkflows = commands.registerCommand(
    'azureBlockchainService.generateEventPublishingWorkflows',
    async (filePath: Uri | undefined) => {
      await tryExecute(() => LogicAppCommands.generateEventPublishingWorkflows(filePath));
    });
  const generateReportPublishingWorkflows = commands.registerCommand(
    'azureBlockchainService.generateReportPublishingWorkflows',
    async (filePath: Uri | undefined) => {
      await tryExecute(() => LogicAppCommands.generateReportPublishingWorkflows(filePath));
    });
  //#endregion

  const startDebugger = commands.registerCommand(
    'extension.truffle.debugTransaction', startSolidityDebugger);

  context.subscriptions.push(showWelcomePage);
  context.subscriptions.push(showRequirementsPage);
  context.subscriptions.push(showSmartContractPage);
  context.subscriptions.push(refresh);
  context.subscriptions.push(newSolidityProject);
  context.subscriptions.push(buildContracts);
  context.subscriptions.push(deployContracts);
  context.subscriptions.push(createConsortium);
  context.subscriptions.push(connectConsortium);
  context.subscriptions.push(disconnectConsortium);
  context.subscriptions.push(copyByteCode);
  context.subscriptions.push(copyABI);
  context.subscriptions.push(copyRPCEndpointAddress);
  context.subscriptions.push(startGanacheServer);
  context.subscriptions.push(stopGanacheServer);
  context.subscriptions.push(generateMicroservicesWorkflows);
  context.subscriptions.push(generateDataPublishingWorkflows);
  context.subscriptions.push(generateEventPublishingWorkflows);
  context.subscriptions.push(generateReportPublishingWorkflows);
  context.subscriptions.push(getPrivateKeyFromMnemonic);
  context.subscriptions.push(startDebugger);

  Telemetry.sendEvent(Constants.telemetryEvents.extensionActivated);
  return required.checkAllApps();
}

export async function deactivate(): Promise<void> {
  // this method is called when your extension is deactivated
  await Output.dispose();
  await Telemetry.dispose();
  await GanacheService.dispose();
  await ContractDB.dispose();
}

async function tryExecute(func: () => Promise<any>, errorMessage: string | null = null): Promise<void> {
  try {
    await func();
  } catch (error) {
    if (error instanceof CancellationEvent) {
      return;
    }
    window.showErrorMessage(errorMessage || error.message);
  }
}
