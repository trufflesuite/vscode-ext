// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {commands, ExtensionContext, Uri, window, workspace} from 'vscode';
import {
  DebuggerCommands,
  GanacheCommands,
  InfuraCommands,
  ProjectCommands,
  sdkCoreCommands,
  ServiceCommands,
  TruffleCommands,
  GenericCommands,
  ContractCommands,
} from './commands';
import {Constants} from './Constants';

import {DebuggerConfiguration} from './debugAdapter/configuration/debuggerConfiguration';
import {required} from '@/helpers/required';
import {CancellationEvent} from './Models';
import {ChangelogPage} from '@/pages/Changelog';
import {RequirementsPage} from '@/pages/Requirements';
import {
  AdapterType,
  ContractDB,
  GanacheService,
  InfuraServiceClient,
  MnemonicRepository,
  TreeManager,
  TreeService,
  DashboardService,
} from './services';
import {Telemetry} from './TelemetryClient';
import {NetworkNodeView, ProjectView} from './ViewItems';
import {registerDashboardView} from './views/DashboardView';
import {registerDeploymentView} from './views/DeploymentsView';
import {registerFileExplorerView} from './views/FileExplorer';
import {registerHelpView} from './views/HelpView';
import {OpenUrlTreeItem} from './views/lib/OpenUrlTreeItem';
import {registerGanacheDetails} from './pages/GanacheDetails';
import {registerLogView} from './views/LogView';
import {saveTextDocument} from './helpers/workspace';
import {StatusBarItems} from './Models/StatusBarItems/Contract';
import {UriHandlerController} from './helpers/uriHandlerController';
import {Output} from './Output';

export async function activate(context: ExtensionContext) {
  const uriHandler = window.registerUriHandler(new UriHandlerController());

  /**
   * Wrapper around `registerCommand` that pushes the resulting `Disposable`
   * into the `context`'s `subscriptions`.
   *
   * See `subscriptions` property in https://code.visualstudio.com/api/references/vscode-api#ExtensionContext.
   */
  function registerCommand(commandId: string, action: (...args: any[]) => any) {
    context.subscriptions.push(commands.registerCommand(commandId, action));
  }

  if (process.env.CODE_TEST) {
    return;
  }

  Constants.initialize(context); // still do this first.

  // INFO: THIS IS THE OLD VERSION OF LOGGER USING OUTPUT CHANNELS
  Output.init(context);

  DebuggerConfiguration.initialize(context);

  // Registering the log view as first because it needs to print the requirement log
  await registerLogView(context);

  await required.checkAllApps();

  // #region commands
  await ContractDB.initialize(AdapterType.IN_MEMORY);
  await InfuraServiceClient.initialize(context.globalState);
  MnemonicRepository.initialize(context.globalState);
  TreeManager.initialize(context.globalState);
  TreeService.initialize('truffle-vscode.truffle');
  await sdkCoreCommands.initialize(context.globalState);

  // Starts the status bar item for automatic deploy
  const contractStatusBarItem = new StatusBarItems.Contract(context.globalState);
  //#endregion

  //#region trufflesuite pages
  const requirementsPage = new RequirementsPage(context);
  const changelogPage = new ChangelogPage(context);

  await changelogPage.checkAndShow();
  //#endregion

  registerCommand('truffle-vscode.openUrl', (node: OpenUrlTreeItem) => node.openUrl());

  //#region trufflesuite extension commands
  const refresh = commands.registerCommand('truffle-vscode.refresh', (element) => {
    TreeService.refresh(element);
  });
  const showRequirementsPage = commands.registerCommand(
    'truffle-vscode.showRequirementsPage',
    async (checkShowOnStartup: boolean) => {
      return checkShowOnStartup ? await requirementsPage.checkAndShow() : await requirementsPage.show();
    }
  );
  //#endregion

  //#region Ganache extension commands
  const startGanacheServer = commands.registerCommand(
    'truffle-vscode.startGanacheServer',
    async (viewItem?: ProjectView) => {
      await tryExecute(() =>
        GanacheCommands.startGanacheCmd(() => GanacheCommands.selectGanachePortAndOptions(viewItem))
      );
    }
  );

  const stopGanacheServer = commands.registerCommand(
    'truffle-vscode.stopGanacheServer',
    async (viewItem?: ProjectView) => {
      await tryExecute(() => GanacheCommands.stopGanacheCmd(viewItem));
    }
  );

  const resartGanacheServer = commands.registerCommand(
    'truffle-vscode.restartGanacheServer',
    async (viewItem?: ProjectView) => {
      await tryExecute(async function () {
        const portAndOptions = await GanacheCommands.stopGanacheCmd(viewItem);
        await GanacheCommands.startGanacheCmd(() => Promise.resolve(portAndOptions));
      });
    }
  );

  await registerGanacheDetails(context);
  //#endregion

  //#region Generic extension commands
  const checkForConnection = commands.registerCommand(
    'truffle-vscode.checkForConnection',
    async (viewItem?: ProjectView) => {
      await tryExecute(() => GenericCommands.checkForConnection(viewItem));
    }
  );
  //#endregion

  //#region truffle commands
  const newSolidityProject = commands.registerCommand('truffle-vscode.newSolidityProject', async () => {
    await tryExecute(() => ProjectCommands.newSolidityProject());
  });

  registerCommand('truffle-vscode.buildSingleContract', async (contractUri: Uri) => {
    await tryExecute(() => sdkCoreCommands.build(contractUri));
  });
  registerCommand('truffle-vscode.buildContracts', async (contractUri?: Uri) => {
    await tryExecute(() => sdkCoreCommands.build(contractUri));
  });
  registerCommand('truffle-vscode.deployContracts', async (contractUri?: Uri) => {
    await tryExecute(() => sdkCoreCommands.deploy(contractUri));
  });
  registerCommand('truffle-vscode.createContract', async (folderUri?: Uri) => {
    await tryExecute(() => TruffleCommands.createContract(folderUri));
  });

  const copyByteCode = commands.registerCommand('truffle-vscode.copyByteCode', async (uri: Uri) => {
    await tryExecute(() => TruffleCommands.writeBytecodeToBuffer(uri));
  });
  const copyDeployedByteCode = commands.registerCommand('truffle-vscode.copyDeployedByteCode', async (uri: Uri) => {
    await tryExecute(() => TruffleCommands.writeDeployedBytecodeToBuffer(uri));
  });
  const copyABI = commands.registerCommand('truffle-vscode.copyABI', async (uri: Uri) => {
    await tryExecute(() => TruffleCommands.writeAbiToBuffer(uri));
  });
  const copyRPCEndpointAddress = commands.registerCommand(
    'truffle-vscode.copyRPCEndpointAddress',
    async (viewItem: NetworkNodeView) => {
      await tryExecute(() => TruffleCommands.writeRPCEndpointAddressToBuffer(viewItem));
    }
  );
  const getPrivateKeyFromMnemonic = commands.registerCommand('truffle-vscode.getPrivateKey', async () => {
    await tryExecute(() => TruffleCommands.getPrivateKeyFromMnemonic());
  });
  const deployContractsOnSave = commands.registerCommand(
    Constants.contract.configuration.statusBar.command,
    async () => {
      // Calls the action that enables/disables auto-deployment when saving a .sol file
      await tryExecute(() => ContractCommands.setEnableOrDisableAutoDeploy(contractStatusBarItem));
    }
  );
  //#endregion

  //#region services with dialog
  const createProject = commands.registerCommand('truffle-vscode.createProject', async () => {
    await tryExecute(() => ServiceCommands.createProject());
  });
  const connectProject = commands.registerCommand('truffle-vscode.connectProject', async () => {
    await tryExecute(() => ServiceCommands.connectProject());
  });
  const disconnectProject = commands.registerCommand(
    'truffle-vscode.disconnectProject',
    async (viewItem: ProjectView) => {
      await tryExecute(() => ServiceCommands.disconnectProject(viewItem));
    }
  );
  //#endregion

  //#region Infura commands
  const signInToInfuraAccount = commands.registerCommand('truffle-vscode.signInToInfuraAccount', async () => {
    await tryExecute(() => InfuraCommands.signIn());
  });
  const signOutOfInfuraAccount = commands.registerCommand('truffle-vscode.signOutOfInfuraAccount', async () => {
    await tryExecute(() => InfuraCommands.signOut());
  });
  const showProjectsFromInfuraAccount = commands.registerCommand(
    'truffle-vscode.showProjectsFromInfuraAccount',
    async () => {
      await tryExecute(() => InfuraCommands.showProjectsFromAccount());
    }
  );
  //#endregion

  //#region debugger commands
  const startDebugger = commands.registerCommand('truffle-vscode.debugTransaction', async () => {
    await tryExecute(() => DebuggerCommands.startSolidityDebugger());
  });
  //#endregion

  //#region workspace subscriptions
  const changeCoreSdkConfigurationListener = workspace.onDidChangeConfiguration(async (event) => {
    if (event.affectsConfiguration(Constants.userSettings.coreSdkSettingsKey)) {
      await sdkCoreCommands.initialize(context.globalState);
    }
  });
  const didSaveTextDocumentListener = workspace.onDidSaveTextDocument(async (event) => {
    // Calls the action that listens for the save files event
    await saveTextDocument(context.globalState, event);
  });
  //#endregion

  //#region truffle views

  const fileExplorerView = registerFileExplorerView('truffle-vscode', 'views.explorer');
  const helpView = registerHelpView('truffle-vscode.views.help');

  const deploymentView = registerDeploymentView('truffle-vscode.views.deployments');
  const dashboardView = registerDashboardView();

  // #endregion

  const subscriptions = [
    uriHandler,
    showRequirementsPage,
    refresh,
    newSolidityProject,
    createProject,
    connectProject,
    disconnectProject,
    copyByteCode,
    copyDeployedByteCode,
    copyABI,
    copyRPCEndpointAddress,
    startDebugger,
    startGanacheServer,
    stopGanacheServer,
    resartGanacheServer,
    getPrivateKeyFromMnemonic,
    deployContractsOnSave,
    signInToInfuraAccount,
    signOutOfInfuraAccount,
    showProjectsFromInfuraAccount,
    changeCoreSdkConfigurationListener,
    didSaveTextDocumentListener,
    // new view - main views
    fileExplorerView,
    helpView,
    deploymentView,
    dashboardView,
    checkForConnection,
  ];
  context.subscriptions.push(...subscriptions);

  Telemetry.sendEvent(Constants.telemetryEvents.extensionActivated);
}

export async function deactivate(): Promise<void> {
  // This method is called when your extension is deactivated
  // To dispose of all extensions, vscode provides 5 sec.
  // Therefore, please, call important dispose functions first and don't use await
  // For more information see https://github.com/Microsoft/vscode/issues/47881
  GanacheService.dispose();
  DashboardService.dispose();
  ContractDB.dispose();
  Telemetry.dispose();
  TreeManager.dispose();
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
