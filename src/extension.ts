// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {commands, ExtensionContext, Uri, window, workspace} from "vscode";
import {
  DebuggerCommands,
  GanacheCommands,
  InfuraCommands,
  ProjectCommands,
  sdkCoreCommands,
  ServiceCommands,
  TruffleCommands,
} from "./commands";
import {Constants} from "./Constants";
import {CommandContext, isWorkspaceOpen, required, setCommandContext} from "./helpers";
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
import {Dependency, ExplorerViewProvider} from "./views/ExplorerViewProvider";

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
  TreeService.initialize("truffle-vscode.truffle");
  await sdkCoreCommands.initialize(context.globalState);

  setCommandContext(CommandContext.Enabled, true);
  setCommandContext(CommandContext.IsWorkspaceOpen, isWorkspaceOpen());

  const welcomePage = new WelcomePage(context);
  const requirementsPage = new RequirementsPage(context);
  const changelogPage = new ChangelogPage(context);

  await welcomePage.checkAndShow();
  await changelogPage.checkAndShow();

  //#region trufflesuite extension commands
  const refresh = commands.registerCommand("truffle-vscode.refresh", (element) => {
    TreeService.refresh(element);
  });
  const showWelcomePage = commands.registerCommand("truffle-vscode.showWelcomePage", async () => {
    return welcomePage.show();
  });
  const showRequirementsPage = commands.registerCommand(
    "truffle-vscode.showRequirementsPage",
    async (checkShowOnStartup: boolean) => {
      return checkShowOnStartup ? await requirementsPage.checkAndShow() : await requirementsPage.show();
    }
  );
  //#endregion

  //#region Ganache extension commands
  const startGanacheServer = commands.registerCommand(
    "truffle-vscode.startGanacheServer",
    async (viewItem?: ProjectView) => {
      await tryExecute(() => GanacheCommands.startGanacheCmd(viewItem));
    }
  );

  const stopGanacheServer = commands.registerCommand(
    "truffle-vscode.stopGanacheServer",
    async (viewItem?: ProjectView) => {
      await tryExecute(() => GanacheCommands.stopGanacheCmd(viewItem));
    }
  );

  const resartGanacheServer = commands.registerCommand(
    "truffle-vscode.restartGanacheServer",
    async (viewItem?: ProjectView) => {
      await tryExecute(() => GanacheCommands.stopGanacheCmd(viewItem)).then(() =>
        tryExecute(() => GanacheCommands.startGanacheCmd(viewItem))
      );
    }
  );
  //#endregion

  //#region truffle commands
  const newSolidityProject = commands.registerCommand("truffle-vscode.newSolidityProject", async () => {
    await tryExecute(() => ProjectCommands.newSolidityProject());
  });
  const buildContracts = commands.registerCommand("truffle-vscode.buildContracts", async () => {
    await tryExecute(() => sdkCoreCommands.build());
  });
  const deployContracts = commands.registerCommand("truffle-vscode.deployContracts", async () => {
    await tryExecute(() => sdkCoreCommands.deploy());
  });
  const copyByteCode = commands.registerCommand("truffle-contract.copyByteCode", async (uri: Uri) => {
    await tryExecute(() => TruffleCommands.writeBytecodeToBuffer(uri));
  });
  const copyDeployedByteCode = commands.registerCommand("truffle-contract.copyDeployedByteCode", async (uri: Uri) => {
    await tryExecute(() => TruffleCommands.writeDeployedBytecodeToBuffer(uri));
  });
  const copyABI = commands.registerCommand("truffle-contract.copyABI", async (uri: Uri) => {
    await tryExecute(() => TruffleCommands.writeAbiToBuffer(uri));
  });
  const copyRPCEndpointAddress = commands.registerCommand(
    "truffle-vscode.copyRPCEndpointAddress",
    async (viewItem: NetworkNodeView) => {
      await tryExecute(() => TruffleCommands.writeRPCEndpointAddressToBuffer(viewItem));
    }
  );
  const getPrivateKeyFromMnemonic = commands.registerCommand("truffle-vscode.getPrivateKey", async () => {
    await tryExecute(() => TruffleCommands.getPrivateKeyFromMnemonic());
  });
  //#endregion

  //#region services with dialog
  const createProject = commands.registerCommand("truffle-vscode.createProject", async () => {
    await tryExecute(() => ServiceCommands.createProject());
  });
  const connectProject = commands.registerCommand("truffle-vscode.connectProject", async () => {
    await tryExecute(() => ServiceCommands.connectProject());
  });
  const disconnectProject = commands.registerCommand(
    "truffle-vscode.disconnectProject",
    async (viewItem: ProjectView) => {
      await tryExecute(() => ServiceCommands.disconnectProject(viewItem));
    }
  );
  const openAtAzurePortal = commands.registerCommand(
    "truffle-vscode.openAtAzurePortal",
    async (viewItem: NetworkNodeView) => ServiceCommands.openAtAzurePortal(viewItem)
  );
  //#endregion

  //#region Infura commands
  const signInToInfuraAccount = commands.registerCommand("truffle-vscode.signInToInfuraAccount", async () => {
    await tryExecute(() => InfuraCommands.signIn());
  });
  const signOutOfInfuraAccount = commands.registerCommand("truffle-vscode.signOutOfInfuraAccount", async () => {
    await tryExecute(() => InfuraCommands.signOut());
  });
  const showProjectsFromInfuraAccount = commands.registerCommand(
    "truffle-vscode.showProjectsFromInfuraAccount",
    async () => {
      await tryExecute(() => InfuraCommands.showProjectsFromAccount());
    }
  );
  //#endregion

  //#region contract commands
  // const createNewBDMApplication = commands.registerCommand(
  //   "truffle-vscode.createNewBDMApplication",
  //   async (viewItem: ProjectView) => {
  //     await tryExecute(() => ServiceCommands.createNewBDMApplication(viewItem));
  //   }
  // );
  // const deleteBDMApplication = commands.registerCommand(
  //   "truffle-vscode.deleteBDMApplication",
  //   async (viewItem: NetworkNodeView) => await tryExecute(() => ServiceCommands.deleteBDMApplication(viewItem))
  // );
  //#endregion

  //#region logic app commands
  // const generateMicroservicesWorkflows = commands.registerCommand(
  //   'truffle-vscode.generateMicroservicesWorkflows',
  //   async (filePath: Uri | undefined) => {
  //     await tryExecute(async () => await LogicAppCommands.generateMicroservicesWorkflows(filePath));
  //   });
  // const generateDataPublishingWorkflows = commands.registerCommand(
  //   'truffle-vscode.generateDataPublishingWorkflows',
  //   async (filePath: Uri | undefined) => {
  //     await tryExecute(async () => await LogicAppCommands.generateDataPublishingWorkflows(filePath));
  //   });
  // const generateEventPublishingWorkflows = commands.registerCommand(
  //   'truffle-vscode.generateEventPublishingWorkflows',
  //   async (filePath: Uri | undefined) => {
  //     await tryExecute(async () => await LogicAppCommands.generateEventPublishingWorkflows(filePath));
  //   });
  // const generateReportPublishingWorkflows = commands.registerCommand(
  //   'truffle-vscode.generateReportPublishingWorkflows',
  //   async (filePath: Uri | undefined) => {
  //     await tryExecute(async () => await LogicAppCommands.generateReportPublishingWorkflows(filePath));
  //   });
  //#endregion

  //#region debugger commands
  const startDebugger = commands.registerCommand("truffle-vscode.debugTransaction", async () => {
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

  // #region TreeDataProvider registrations
  const rootPath =
    workspace.workspaceFolders && workspace.workspaceFolders.length > 0
      ? workspace.workspaceFolders[0].uri.fsPath
      : undefined;
  const explorerViewProvider = new ExplorerViewProvider(rootPath);
  window.registerTreeDataProvider("truffle-vscode.explorer-view", explorerViewProvider);
  commands.registerCommand("nodeDependencies.refreshEntry", () => explorerViewProvider.refresh());
  commands.registerCommand("extension.openPackageOnNpm", (moduleName) =>
    commands.executeCommand("vscode.open", Uri.parse(`https://www.npmjs.com/package/${moduleName}`))
  );
  commands.registerCommand("nodeDependencies.addEntry", () =>
    window.showInformationMessage(`Successfully called add entry.`)
  );
  commands.registerCommand("nodeDependencies.editEntry", (node: Dependency) =>
    window.showInformationMessage(`Successfully called edit entry on ${node.label}.`)
  );
  commands.registerCommand("nodeDependencies.deleteEntry", (node: Dependency) =>
    window.showInformationMessage(`Successfully called delete entry on ${node.label}.`)
  );

  // #endregion

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
    resartGanacheServer,
    // generateMicroservicesWorkflows,
    // generateDataPublishingWorkflows,
    // generateEventPublishingWorkflows,
    // generateReportPublishingWorkflows,
    getPrivateKeyFromMnemonic,
    signInToInfuraAccount,
    signOutOfInfuraAccount,
    showProjectsFromInfuraAccount,
    openAtAzurePortal,
    changeCoreSdkConfigurationListener,
  ];
  context.subscriptions.push(...subscriptions);

  await required.checkAllApps();

  Telemetry.sendEvent(Constants.telemetryEvents.extensionActivated);
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
