import vscode, {
  commands,
  ProviderResult,
  ThemeIcon,
  TreeItem,
  Uri,
  Event,
  TreeDataProvider,
  TreeItemCollapsibleState,
  TreeView,
} from 'vscode';
import {DashboardCommands} from '../commands';
import {DashboardService} from '../services';
import {Constants} from '../Constants';
import {vscodeEnvironment} from '../helpers';

class DashboardTreeItem extends TreeItem {
  constructor(
    readonly label: string,
    readonly description: string,
    readonly iconPath: string | Uri | {light: string | Uri; dark: string | Uri} | ThemeIcon,
    readonly contextValue: string,
    readonly children?: DashboardTreeItem[]
  ) {
    super(label, children === undefined ? TreeItemCollapsibleState.None : TreeItemCollapsibleState.Expanded);
    this.description = description;
    this.iconPath = iconPath;
    this.contextValue = contextValue;
  }
}

class DashboardTreeDataProvider implements TreeDataProvider<DashboardTreeItem> {
  onDidChangeTreeData?: Event<void | DashboardTreeItem | DashboardTreeItem[] | null | undefined> | undefined;

  parent: DashboardTreeItem[];

  constructor() {
    this.parent = [
      new DashboardTreeItem(
        Constants.treeItemData.dashboard.label,
        `${Constants.networkProtocols.http}${Constants.localhost}:${Constants.dashboardPort}`,
        Constants.treeItemData.dashboard.iconPath,
        Constants.treeItemData.dashboard.contextValue
      ),
    ];
  }

  getTreeItem(element: DashboardTreeItem): TreeItem | Thenable<TreeItem> {
    return element;
  }

  getChildren(element?: DashboardTreeItem | undefined): ProviderResult<DashboardTreeItem[]> {
    if (element === undefined) {
      return this.parent;
    }
    return element.children;
  }
}

/**
 * Register our dashboard view as:
 *  viewID: "truffle-vscode.views.dashboard"
 *
 * @param viewId - the viewId - defaults to above.
 */
export function registerDashboardView(viewId = 'truffle-vscode.views.dashboard'): TreeView<DashboardTreeItem> {
  const dashboardUrl = `${Constants.networkProtocols.http}${Constants.localhost}:${Constants.dashboardPort}`;

  commands.registerCommand(`${viewId}.startDashboardServer`, async () => {
    await DashboardCommands.startDashboardCmd();
  });
  commands.registerCommand(`${viewId}.stopDashboardServer`, async () => {
    await DashboardCommands.stopDashboardCmd();
  });
  commands.registerCommand(`${viewId}.restartDashboardServer`, async () => {
    await DashboardCommands.stopDashboardCmd().then(() => DashboardCommands.startDashboardCmd());
  });
  commands.registerCommand(`${viewId}.openDashboard`, async () => {
    const portStatus = await DashboardService.getPortStatus(Constants.dashboardPort);

    if (portStatus === DashboardService.PortStatus.FREE) return await DashboardCommands.startDashboardCmd();

    await vscode.env.openExternal(vscode.Uri.parse(dashboardUrl));
  });
  commands.registerCommand(`${viewId}.copyRPCEndpointAddress`, async () => {
    const rpc = `${dashboardUrl}/rpc`;
    await vscodeEnvironment.writeToClipboard(rpc);

    vscode.window.showInformationMessage(Constants.informationMessage.rpcEndpointCopiedToClipboard);
  });

  return vscode.window.createTreeView(viewId, {
    treeDataProvider: new DashboardTreeDataProvider(),
  });
}
