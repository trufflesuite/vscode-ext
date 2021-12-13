// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {commands, ExtensionContext, Uri, window, workspace} from "vscode";
import {
  DebuggerCommands,
  GanacheCommands,
  InfuraCommands,
  OpenZeppelinCommands,
  ProjectCommands,
  sdkCoreCommands,
  ServiceCommands,
  TruffleCommands,
} from "./commands";
import {Constants} from "./Constants";
import {CommandContext, isWorkspaceOpen, openZeppelinHelper, required, setCommandContext} from "./helpers";
import {CancellationEvent} from "./Models";
import {Output} from "./Output";
import {ChangelogPage, RequirementsPage, WelcomePage} from "./pages";
import {
  AdapterType,
  ContractDB,
  GanacheService,
  InfuraServiceClient,
  MnemonicRepository,
  TreeManager,
  TreeService,
} from "./services";
import {Telemetry} from "./TelemetryClient";
import {NetworkNodeView, ProjectView} from "./ViewItems";

import {DebuggerConfiguration} from "./debugAdapter/configuration/debuggerConfiguration";

export async function activate(context: ExtensionContext) {
  if (process.env.CODE_TEST) {
    return;
  }

  Constants.initialize(context);
  DebuggerConfiguration.initialize(context);
  await ContractDB.initialize(AdapterType.IN_MEMORY);
  await InfuraServiceClient.initialize(context.globalState);
  MnemonicRepository.initialize(context.globalState);
  TreeManager.initialize(context.globalState);
  // FIXME: i think this is breaking things..
  TreeService.initialize("Trufflesuite");
  await sdkCoreCommands.initialize(context.globalState);

  setCommandContext(CommandContext.Enabled, true);
  setCommandContext(CommandContext.IsWorkspaceOpen, isWorkspaceOpen());

  const welcomePage = new WelcomePage(context);
  const requirementsPage = new RequirementsPage(context);
  const changelogPage = new ChangelogPage(context);

  await welcomePage.checkAndShow();
  await changelogPage.checkAndShow();

  //#region trufflesuite extension commands
  const refresh = commands.registerCommand("trufflesuite.refresh", (element) => {
    TreeService.refresh(element);
  });
  const showWelcomePage = commands.registerCommand("trufflesuite.showWelcomePage", async () => {
    return welcomePage.show();
  });
  const showRequirementsPage = commands.registerCommand(
    "trufflesuite.showRequirementsPage",
    async (checkShowOnStartup: boolean) => {
      return checkShowOnStartup ? await requirementsPage.checkAndShow() : await requirementsPage.show();
    }
  );
  //#endregion

  //#region Ganache extension commands
  const startGanacheServer = commands.registerCommand(
    "trufflesuite.startGanacheServer",
    async (viewItem?: ProjectView) => {
      await tryExecute(() => GanacheCommands.startGanacheCmd(viewItem));
    }
  );

  const stopGanacheServer = commands.registerCommand(
    "trufflesuite.stopGanacheServer",
    async (viewItem?: ProjectView) => {
      await tryExecute(() => GanacheCommands.stopGanacheCmd(viewItem));
    }
  );
  //#endregion

  //#region truffle commands
  const newSolidityProject = commands.registerCommand("truffle.newSolidityProject", async () => {
    await tryExecute(() => ProjectCommands.newSolidityProject());
  });
  const buildContracts = commands.registerCommand("trufflesuite.buildContracts", async () => {
    await tryExecute(() => sdkCoreCommands.build());
  });
  const deployContracts = commands.registerCommand("trufflesuite.deployContracts", async () => {
    await tryExecute(() => sdkCoreCommands.deploy());
  });
  const copyByteCode = commands.registerCommand("contract.copyByteCode", async (uri: Uri) => {
    await tryExecute(() => TruffleCommands.writeBytecodeToBuffer(uri));
  });
  const copyDeployedByteCode = commands.registerCommand("contract.copyDeployedByteCode", async (uri: Uri) => {
    await tryExecute(() => TruffleCommands.writeDeployedBytecodeToBuffer(uri));
  });
  const copyABI = commands.registerCommand("contract.copyABI", async (uri: Uri) => {
    await tryExecute(() => TruffleCommands.writeAbiToBuffer(uri));
  });
  const copyRPCEndpointAddress = commands.registerCommand(
    "trufflesuite.copyRPCEndpointAddress",
    async (viewItem: NetworkNodeView) => {
      await tryExecute(() => TruffleCommands.writeRPCEndpointAddressToBuffer(viewItem));
    }
  );
  const getPrivateKeyFromMnemonic = commands.registerCommand("trufflesuite.getPrivateKey", async () => {
    await tryExecute(() => TruffleCommands.getPrivateKeyFromMnemonic());
  });
  //#endregion

  //#region services with dialog
  const createProject = commands.registerCommand("trufflesuite.createProject", async () => {
    await tryExecute(() => ServiceCommands.createProject());
  });
  const connectProject = commands.registerCommand("trufflesuite.connectProject", async () => {
    await tryExecute(() => ServiceCommands.connectProject());
  });
  const disconnectProject = commands.registerCommand(
    "trufflesuite.disconnectProject",
    async (viewItem: ProjectView) => {
      await tryExecute(() => ServiceCommands.disconnectProject(viewItem));
    }
  );
  const openAtAzurePortal = commands.registerCommand(
    "trufflesuite.openAtAzurePortal",
    async (viewItem: NetworkNodeView) => ServiceCommands.openAtAzurePortal(viewItem)
  );
  //#endregion

  //#region Infura commands
  const signInToInfuraAccount = commands.registerCommand("trufflesuite.signInToInfuraAccount", async () => {
    await tryExecute(() => InfuraCommands.signIn());
  });
  const signOutOfInfuraAccount = commands.registerCommand("trufflesuite.signOutOfInfuraAccount", async () => {
    await tryExecute(() => InfuraCommands.signOut());
  });
  const showProjectsFromInfuraAccount = commands.registerCommand(
    "trufflesuite.showProjectsFromInfuraAccount",
    async () => {
      await tryExecute(() => InfuraCommands.showProjectsFromAccount());
    }
  );
  //#endregion

  //#region contract commands
  // const createNewBDMApplication = commands.registerCommand(
  //   "trufflesuite.createNewBDMApplication",
  //   async (viewItem: ProjectView) => {
  //     await tryExecute(() => ServiceCommands.createNewBDMApplication(viewItem));
  //   }
  // );
  // const deleteBDMApplication = commands.registerCommand(
  //   "trufflesuite.deleteBDMApplication",
  //   async (viewItem: NetworkNodeView) => await tryExecute(() => ServiceCommands.deleteBDMApplication(viewItem))
  // );
  //#endregion

  //#region open zeppelin commands
  const openZeppelinAddCategory = commands.registerCommand("openZeppelin.addCategory", async () => {
    await tryExecute(() => OpenZeppelinCommands.addCategory());
  });
  //#endregion

  //#region logic app commands
  // const generateMicroservicesWorkflows = commands.registerCommand(
  //   'trufflesuite.generateMicroservicesWorkflows',
  //   async (filePath: Uri | undefined) => {
  //     await tryExecute(async () => await LogicAppCommands.generateMicroservicesWorkflows(filePath));
  //   });
  // const generateDataPublishingWorkflows = commands.registerCommand(
  //   'trufflesuite.generateDataPublishingWorkflows',
  //   async (filePath: Uri | undefined) => {
  //     await tryExecute(async () => await LogicAppCommands.generateDataPublishingWorkflows(filePath));
  //   });
  // const generateEventPublishingWorkflows = commands.registerCommand(
  //   'trufflesuite.generateEventPublishingWorkflows',
  //   async (filePath: Uri | undefined) => {
  //     await tryExecute(async () => await LogicAppCommands.generateEventPublishingWorkflows(filePath));
  //   });
  // const generateReportPublishingWorkflows = commands.registerCommand(
  //   'trufflesuite.generateReportPublishingWorkflows',
  //   async (filePath: Uri | undefined) => {
  //     await tryExecute(async () => await LogicAppCommands.generateReportPublishingWorkflows(filePath));
  //   });
  //#endregion

  //#region debugger commands
  const startDebugger = commands.registerCommand("extension.truffle.debugTransaction", async () => {
    await tryExecute(() => DebuggerCommands.startSolidityDebugger());
  });
  //#endregion

  //#region other subscriptions
  const changeCoreSdkConfigurationListener = workspace.onDidChangeConfiguration(async (event) => {
    if (event.affectsConfiguration(Constants.userSettings.coreSdkSettingsKey)) {
      await sdkCoreCommands.initialize(context.globalState);
    }
  });
  //#endregion

  const subscriptions = [
    showWelcomePage,
    showRequirementsPage,
    refresh,
    newSolidityProject,
    buildContracts,
    deployContracts,
    // createNewBDMApplication,
    createProject,
    connectProject,
    // deleteBDMApplication,
    disconnectProject,
    copyByteCode,
    copyDeployedByteCode,
    copyABI,
    copyRPCEndpointAddress,
    startDebugger,
    startGanacheServer,
    stopGanacheServer,
    // generateMicroservicesWorkflows,
    // generateDataPublishingWorkflows,
    // generateEventPublishingWorkflows,
    // generateReportPublishingWorkflows,
    getPrivateKeyFromMnemonic,
    signInToInfuraAccount,
    signOutOfInfuraAccount,
    showProjectsFromInfuraAccount,
    openZeppelinAddCategory,
    openAtAzurePortal,
    changeCoreSdkConfigurationListener,
  ];
  context.subscriptions.push(...subscriptions);

  required.checkAllApps();

  Telemetry.sendEvent(Constants.telemetryEvents.extensionActivated);

  checkAndUpgradeOpenZeppelinAsync();
}

export async function deactivate(): Promise<void> {
  // This method is called when your extension is deactivated
  // To dispose of all extensions, vscode provides 5 sec.
  // Therefore, please, call important dispose functions first and don't use await
  // For more information see https://github.com/Microsoft/vscode/issues/47881
  GanacheService.dispose();
  ContractDB.dispose();
  Telemetry.dispose();
  TreeManager.dispose();
  Output.dispose();
}

async function tryExecute(func: () => Promise<any>, errorMessage: string | null = null): Promise<void> {
  try {
    await func();
  } catch (error) {
    if (error instanceof CancellationEvent) {
      return;
    }
    window.showErrorMessage(errorMessage || (error as Error).message);
  }
}

async function checkAndUpgradeOpenZeppelinAsync(): Promise<void> {
  if (await openZeppelinHelper.shouldUpgradeOpenZeppelinAsync()) {
    await openZeppelinHelper.upgradeOpenZeppelinUserSettingsAsync();
    await openZeppelinHelper.upgradeOpenZeppelinContractsAsync();
  }
}
