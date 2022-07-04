// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {registerUIExtensionVariables} from '@microsoft/vscode-azext-utils';
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
} from './commands';
import {Constants, ext} from './Constants';

import {DebuggerConfiguration} from './debugAdapter/configuration/debuggerConfiguration';
import {CommandContext, isWorkspaceOpen, setCommandContext} from './helpers';
import {required} from './helpers/required';
import {CancellationEvent} from './Models';
import {Output} from './Output';
import {ChangelogPage, RequirementsPage, WelcomePage} from './pages';
import {
  AdapterType,
  ContractDB,
  GanacheService,
  InfuraServiceClient,
  MnemonicRepository,
  TreeManager,
  TreeService,
} from './services';
import {Telemetry} from './TelemetryClient';
import {NetworkNodeView, ProjectView} from './ViewItems';
import {registerDeploymentView} from './views/DeploymentsView';
import {registerFileExplorerView} from './views/fileExplorer';
import {registerHelpView} from './views/HelpView';

/**
 * This function registers variables similar to docker plugin, going forward this seems a better method of doing things.
 *
 * @param ctx the context we want to work on.
 */
function initializeExtensionVariables(ctx: ExtensionContext): void {
  ext.context = ctx;
  ext.outputChannel = Output.subscribe();
  registerUIExtensionVariables(ext);
}

export async function activate(context: ExtensionContext) {
  if (process.env.CODE_TEST) {
    return;
  }

  Constants.initialize(context); // still do this first.
  initializeExtensionVariables(context);

  DebuggerConfiguration.initialize(context);

  await required.checkAllApps();

  await ContractDB.initialize(AdapterType.IN_MEMORY);
  await InfuraServiceClient.initialize(context.globalState);
  MnemonicRepository.initialize(context.globalState);
  TreeManager.initialize(context.globalState);
  TreeService.initialize('truffle-vscode.truffle');
  await sdkCoreCommands.initialize(context.globalState);

  setCommandContext(CommandContext.Enabled, true);
  setCommandContext(CommandContext.IsWorkspaceOpen, isWorkspaceOpen());

  const welcomePage = new WelcomePage(context);
  const requirementsPage = new RequirementsPage(context);
  const changelogPage = new ChangelogPage(context);

  await welcomePage.checkAndShow();
  await changelogPage.checkAndShow();

  //#region trufflesuite extension commands
  const refresh = commands.registerCommand('truffle-vscode.refresh', (element) => {
    TreeService.refresh(element);
  });
  const showWelcomePage = commands.registerCommand('truffle-vscode.showWelcomePage', async () => {
    return welcomePage.show();
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
      await tryExecute(() => GanacheCommands.startGanacheCmd(viewItem));
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
      await tryExecute(() => GanacheCommands.stopGanacheCmd(viewItem)).then(() =>
        tryExecute(() => GanacheCommands.startGanacheCmd(viewItem))
      );
    }
  );
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
  const buildContracts = commands.registerCommand('truffle-vscode.buildContracts', async (uri: Uri) => {
    await tryExecute(() => sdkCoreCommands.build(uri));
  });
  const deployContracts = commands.registerCommand('truffle-vscode.deployContracts', async (uri: Uri) => {
    await tryExecute(() => sdkCoreCommands.deploy(uri));
  });
  const createContract = commands.registerCommand('truffle-vscode.createContract', async (uri: Uri) => {
    await tryExecute(() => TruffleCommands.createContract(uri));
  });
  const copyByteCode = commands.registerCommand('truffle-contract.copyByteCode', async (uri: Uri) => {
    await tryExecute(() => TruffleCommands.writeBytecodeToBuffer(uri));
  });
  const copyDeployedByteCode = commands.registerCommand('truffle-contract.copyDeployedByteCode', async (uri: Uri) => {
    await tryExecute(() => TruffleCommands.writeDeployedBytecodeToBuffer(uri));
  });
  const copyABI = commands.registerCommand('truffle-contract.copyABI', async (uri: Uri) => {
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

  //#region other subscriptions
  const changeCoreSdkConfigurationListener = workspace.onDidChangeConfiguration(async (event) => {
    if (event.affectsConfiguration(Constants.userSettings.coreSdkSettingsKey)) {
      await sdkCoreCommands.initialize(context.globalState);
    }
  });
  //#endregion

  // #region truffle views

  const fileExplorerView = registerFileExplorerView('truffle-vscode', 'views.explorer');
  const helpView = registerHelpView();

  const deploymentView = registerDeploymentView();

  // #endregion

  const subscriptions = [
    showWelcomePage,
    showRequirementsPage,
    refresh,
    newSolidityProject,
    buildContracts,
    deployContracts,
    createContract,
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
    signInToInfuraAccount,
    signOutOfInfuraAccount,
    showProjectsFromInfuraAccount,
    changeCoreSdkConfigurationListener,
    // new view - main views
    fileExplorerView,
    helpView,
    deploymentView,
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
