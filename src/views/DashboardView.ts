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
} from "vscode";
import {DashboardCommands} from "../commands";
import {Constants} from "../Constants";
import {vscodeEnvironment} from "../helpers";

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
        Constants.treeItemData.service.dashboard.label,
        `${Constants.networkProtocols.http}${Constants.localhost}:${Constants.dashboardPort}`,
        Constants.treeItemData.service.dashboard.iconPath,
        Constants.treeItemData.service.dashboard.contextValue
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
export function registerDashboardView(viewId: string = "truffle-vscode.views.dashboard"): TreeView<DashboardTreeItem> {
  commands.registerCommand(`${viewId}.startDashboardServer`, async () => {
    await DashboardCommands.startDashboardCmd();
  });
  commands.registerCommand(`${viewId}.stopDashboardServer`, async () => {
    await DashboardCommands.stopDashboardCmd();
  });
  commands.registerCommand(`${viewId}.restartDashboardServer`, async () => {
    await DashboardCommands.stopDashboardCmd().then(() => DashboardCommands.startDashboardCmd());
  });
  commands.registerCommand(`${viewId}.copyRPCEndpointAddress`, async () => {
    await vscodeEnvironment.writeToClipboard(
      `${Constants.networkProtocols.http}${Constants.localhost}:${Constants.dashboardPort}/rpc`
    );
    vscode.window.showInformationMessage(Constants.informationMessage.rpcEndpointCopiedToClipboard);
  });

  return vscode.window.createTreeView(viewId, {
    treeDataProvider: new DashboardTreeDataProvider(),
  });
}
