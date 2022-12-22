// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {commands, type ExtensionContext, type Uri, window, workspace, type Disposable} from 'vscode';

import {ContractCommands} from '@/commands/ContractCommands';
import {GanacheCommands} from '@/commands/GanacheCommands';
import {InfuraCommands} from '@/commands/InfuraCommands';
import {ProjectCommands} from '@/commands/ProjectCommands';
import {ServiceCommands} from '@/commands/ServiceCommands';
import {TruffleCommands} from '@/commands/TruffleCommands';
import {sdkCoreCommands} from '@/commands/SdkCoreCommands';
import {GenericCommands} from '@/commands/GenericCommands';
import {DebuggerCommands} from '@/commands/DebuggerCommands';

import {Constants} from './Constants';

import {DebuggerConfiguration} from './debugAdapter/configuration/debuggerConfiguration';
import {required} from '@/helpers/required';
import {CancellationEvent} from './Models/CancellationEvent';
import {ChangelogPage} from '@/pages/Changelog';
import {RequirementsPage} from '@/pages/Requirements';
import {AdapterType, ContractDB} from '@/services/contract/ContractDB';
import {InfuraServiceClient} from '@/services/infuraService/InfuraServiceClient';
import {MnemonicRepository} from '@/services/MnemonicRepository';
import {TreeManager} from '@/services/tree/TreeManager';
import {NetworksView, type ProjectView, type NetworkNodeView} from '@/views/NetworksView';
import {GanacheService} from '@/services/ganache/GanacheService';
import {DashboardService} from '@/services/dashboard/DashboardService';
import {Telemetry} from './Telemetry';
import {registerDashboardView} from './views/DashboardView';
import {registerDeploymentView} from './views/DeploymentsView';
import {ContractExplorerView} from './views/ContractExplorerView';
import {HelpView} from './views/HelpView';
import type {OpenUrlTreeItem} from './views/lib/OpenUrlTreeItem';
import {registerGanacheDetails} from './pages/GanacheDetails';
import {registerLogView} from './views/LogView';
import {saveTextDocument} from './helpers/workspace';
import {StatusBarItems} from './Models/StatusBarItems/Contract';
import {UriHandlerController} from './helpers/uriHandlerController';
import {Output} from './Output';

// ts-prune-ignore-next
export async function activate(context: ExtensionContext): Promise<void> {
  function register(disposable: Disposable) {
    context.subscriptions.push(disposable);
  }

  /**
   * Wrapper around `registerCommand` that pushes the resulting `Disposable`
   * into the `context`'s `subscriptions`.
   *
   * See `subscriptions` property in https://code.visualstudio.com/api/references/vscode-api#ExtensionContext.
   */
  function registerCommand(commandId: string, action: (...args: any[]) => any) {
    register(commands.registerCommand(commandId, action));
  }

  register(window.registerUriHandler(new UriHandlerController()));

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

  const networksView = new NetworksView();
  window.registerTreeDataProvider('truffle-vscode.truffle', networksView);

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
  registerCommand('truffle-vscode.refresh', (element) => {
    networksView.refresh(element);
  });
  registerCommand('truffle-vscode.showRequirementsPage', async (checkShowOnStartup: boolean) => {
    return checkShowOnStartup ? await requirementsPage.checkAndShow() : await requirementsPage.show();
  });
  //#endregion

  //#region Ganache extension commands
  registerCommand('truffle-vscode.startGanacheServer', async (viewItem?: ProjectView) => {
    await tryExecute(() =>
      GanacheCommands.startGanacheCmd(() => GanacheCommands.selectGanachePortAndOptions(viewItem))
    );
  });

  registerCommand('truffle-vscode.stopGanacheServer', async (viewItem?: ProjectView) => {
    await tryExecute(() => GanacheCommands.stopGanacheCmd(viewItem));
  });

  registerCommand('truffle-vscode.restartGanacheServer', async (viewItem?: ProjectView) => {
    await tryExecute(async function () {
      const portAndOptions = await GanacheCommands.stopGanacheCmd(viewItem);
      await GanacheCommands.startGanacheCmd(() => Promise.resolve(portAndOptions));
    });
  });

  await registerGanacheDetails(context);
  //#endregion

  //#region Generic extension commands
  registerCommand('truffle-vscode.checkForConnection', async (viewItem?: ProjectView) => {
    await tryExecute(() => GenericCommands.checkForConnection(viewItem));
  });
  //#endregion

  //#region truffle commands
  registerCommand('truffle-vscode.newSolidityProject', async () => {
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

  registerCommand('truffle-vscode.copyByteCode', async (uri: Uri) => {
    await tryExecute(() => TruffleCommands.writeBytecodeToBuffer(uri));
  });
  registerCommand('truffle-vscode.copyDeployedByteCode', async (uri: Uri) => {
    await tryExecute(() => TruffleCommands.writeDeployedBytecodeToBuffer(uri));
  });
  registerCommand('truffle-vscode.copyABI', async (uri: Uri) => {
    await tryExecute(() => TruffleCommands.writeAbiToBuffer(uri));
  });
  registerCommand('truffle-vscode.copyRPCEndpointAddress', async (viewItem: NetworkNodeView) => {
    await tryExecute(() => TruffleCommands.writeRPCEndpointAddressToBuffer(viewItem));
  });
  registerCommand('truffle-vscode.getPrivateKey', async () => {
    await tryExecute(() => TruffleCommands.getPrivateKeyFromMnemonic());
  });
  registerCommand(Constants.contract.configuration.statusBar.command, async () => {
    // Calls the action that enables/disables auto-deployment when saving a .sol file
    await tryExecute(() => Promise.resolve(ContractCommands.setEnableOrDisableAutoDeploy(contractStatusBarItem)));
  });
  //#endregion

  //#region services with dialog
  registerCommand('truffle-vscode.createProject', async () => {
    await tryExecute(() => ServiceCommands.createProject());
  });
  registerCommand('truffle-vscode.connectProject', async () => {
    await tryExecute(() => ServiceCommands.connectProject());
  });
  registerCommand('truffle-vscode.disconnectProject', async (viewItem: ProjectView) => {
    await tryExecute(() => ServiceCommands.disconnectProject(viewItem));
  });
  //#endregion

  //#region Infura commands
  registerCommand('truffle-vscode.signInToInfuraAccount', async () => {
    await tryExecute(() => InfuraCommands.signIn());
  });
  registerCommand('truffle-vscode.signOutOfInfuraAccount', async () => {
    await tryExecute(() => InfuraCommands.signOut());
  });
  registerCommand('truffle-vscode.showProjectsFromInfuraAccount', async () => {
    await tryExecute(() => InfuraCommands.showProjectsFromAccount());
  });
  //#endregion

  //#region debugger commands
  registerCommand('truffle-vscode.debugTransaction', async () => {
    await tryExecute(() => DebuggerCommands.startSolidityDebugger());
  });
  //#endregion

  //#region workspace subscriptions
  register(
    workspace.onDidChangeConfiguration(async (event) => {
      if (event.affectsConfiguration(Constants.userSettings.coreSdkSettingsKey)) {
        await sdkCoreCommands.initialize(context.globalState);
      }
    })
  );
  register(
    workspace.onDidSaveTextDocument(async (event) => {
      // Calls the action that listens for the save files event
      await saveTextDocument(context.globalState, event);
    })
  );
  //#endregion

  //#region truffle views
  {
    const openFileCommand = `truffle-vscode.openFile`;
    const contractExplorerView = new ContractExplorerView(openFileCommand);
    registerCommand(openFileCommand, (resource: Uri) => window.showTextDocument(resource));
    registerCommand('truffle-vscode.views.explorer.refreshExplorer', () => contractExplorerView.refresh());
    register(window.createTreeView('truffle-vscode.views.explorer', {treeDataProvider: contractExplorerView}));
  }

  register(
    window.createTreeView('truffle-vscode.views.help', {treeDataProvider: new HelpView(), canSelectMany: false})
  );

  register(registerDeploymentView('truffle-vscode.views.deployments'));
  register(registerDashboardView());

  // #endregion
  Telemetry.sendEvent(Constants.telemetryEvents.extensionActivated);
}

// ts-prune-ignore-next
export function deactivate(): void {
  // This method is called when your extension is deactivated
  // To dispose of all extensions, vscode provides 5 sec.
  // Therefore, please, call important dispose functions first and don't use await
  // For more information see https://github.com/Microsoft/vscode/issues/47881
  void GanacheService.dispose();
  void DashboardService.dispose();
  void ContractDB.dispose();
  void Telemetry.dispose();

  TreeManager.dispose();
}

async function tryExecute(func: () => Promise<any>, errorMessage: string | null = null): Promise<void> {
  try {
    await func();
  } catch (error) {
    if (error instanceof CancellationEvent) {
      return;
    }
    void window.showErrorMessage(errorMessage || (error as Error).message);
  }
}
