// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { commands, ExtensionContext, Uri, window } from 'vscode';
import { AzureBlockchain } from './AzureBlockchain';
import { ConsortiumCommands } from './commands/ConsortiumCommands';
import { ContractCommands } from './commands/ContractCommands';
import { GanacheCommands } from './commands/GanacheCommands';
import { LogicAppCommands } from './commands/LogicAppCommands';
import { ProjectCommands } from './commands/ProjectCommands';
import { TruffleCommands } from './commands/TruffleCommands';
import { WestlakeCommands } from './commands/WestlakeCommands';
import { Constants } from './Constants';
import { CommandContext, isWorkspaceOpen, required, setCommandContext } from './helpers';
import { MnemonicRepository } from './MnemonicService/MnemonicRepository';
import { CancellationEvent } from './Models';
import { Output } from './Output';
import { RequirementsPage, WelcomePage } from './pages';
import { TelemetryClient } from './TelemetryClient';
import { ConsortiumTree } from './treeService/ConsortiumTree';
import { ConsortiumTreeManager } from './treeService/ConsortiumTreeManager';
import { ConsortiumView } from './ViewItems';

export async function activate(context: ExtensionContext) {
  Constants.initialize(context);
  MnemonicRepository.initialize(context.globalState);
  TelemetryClient.initialize();

  setCommandContext(CommandContext.Enabled, true);
  setCommandContext(CommandContext.IsWorkspaceOpen, isWorkspaceOpen());

  const welcomePage = new WelcomePage(context);
  const requirementsPage = new RequirementsPage(context);
  const consortiumTreeManager = new ConsortiumTreeManager(context);
  const consortiumTree = new ConsortiumTree(consortiumTreeManager);

  await welcomePage.checkAndShow();
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
  const copyRPCEndpointAddress = commands.registerCommand('azureBlockchainService.copyRPCEndpointAddress',
    async (viewItem: ConsortiumView) => {
    await tryExecute(() => AzureBlockchain.copyRPCEndpointAddress(viewItem));
  });
  const installNpm = commands.registerCommand('azureBlockchainService.required.installNpm', async () => {
    await tryExecute(() => required.installNpm());
  });
  const installTruffle = commands.registerCommand('azureBlockchainService.required.installTruffle', async () => {
    await tryExecute(() => required.installTruffle());
  });
  const installGanache = commands.registerCommand('azureBlockchainService.required.installGanache', async () => {
    await tryExecute(() => required.installGanache());
  });
  const getAllVersions = commands.registerCommand('azureBlockchainService.required.getAllVersions', async () => {
    await tryExecute(() => required.getAllVersions());
  });
  //#endregion

  //#region Ganache extension commands
  const startGanacheServer = commands.registerCommand('azureBlockchainService.startGanacheServer',
    async () => {
    await tryExecute(() => GanacheCommands.startGanacheCmd());
  });

  const stopGanacheServer = commands.registerCommand('azureBlockchainService.stopGanacheServer',
  async () => {
    await tryExecute(() => GanacheCommands.stopGanacheCmd());
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

  //#region remix commands
  const viewGasEstimates = commands.registerCommand('remix.viewGasEstimates', async () => {
    await tryExecute(() => AzureBlockchain.viewGasEstimates());
  });
  const generateSmartContractUI = commands.registerCommand('drizzle.generateSmartContractUI', async () => {
    await tryExecute(() => ContractCommands.generateSmartContractUI());
  });
  //#endregion

  //#region westlake commands
  const pushCurrentLedgerEvents = commands.registerCommand('azureBlockchainService.pushCurrentLedgerEvents',
    async () => {
    await tryExecute(() => runWithCurrentOpenFile(WestlakeCommands.showLedgerEventsDialog));
  });
  const pushLedgerEvents = commands.registerCommand('azureBlockchainService.pushLedgerEvents', async (uri: Uri) => {
    await tryExecute(() => WestlakeCommands.showLedgerEventsDialog(uri));
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

  context.subscriptions.push(showWelcomePage);
  context.subscriptions.push(showRequirementsPage);
  context.subscriptions.push(installNpm);
  context.subscriptions.push(installTruffle);
  context.subscriptions.push(installGanache);
  context.subscriptions.push(getAllVersions);
  context.subscriptions.push(generateSmartContractUI);
  context.subscriptions.push(refresh);
  context.subscriptions.push(newSolidityProject);
  context.subscriptions.push(buildContracts);
  context.subscriptions.push(deployContracts);
  context.subscriptions.push(pushLedgerEvents);
  context.subscriptions.push(pushCurrentLedgerEvents);
  context.subscriptions.push(viewGasEstimates);
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

  return required.checkAllApps();
}

export async function deactivate(): Promise<void> {
  // this method is called when your extension is deactivated
  await Output.dispose();

  return GanacheCommands.dispose();
}

async function tryExecute(func: () => Promise<any>, errorMessage: string | null = null): Promise<void> {
  try {
    await func();
  } catch (error) {
    if (error instanceof CancellationEvent) {
      return;
    }
    window.showErrorMessage(errorMessage ? errorMessage : error.message);
  }
}

async function runWithCurrentOpenFile(func: (uri: Uri) => {}): Promise<void> {
  const currentTextEditor = window.activeTextEditor;
  if (currentTextEditor === undefined) {
    throw new Error('There is no open file.');
  }

  await func(currentTextEditor.document.uri);
}
