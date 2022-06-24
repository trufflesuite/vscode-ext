import {
  AzExtParentTreeItem,
  AzExtTreeDataProvider,
  AzExtTreeItem,
  GenericTreeItem,
  IActionContext,
} from "@microsoft/vscode-azext-utils";
import vscode, {commands} from "vscode";
import {DashboardCommands} from "../commands";
import {Constants} from "../Constants";
import {vscodeEnvironment} from "../helpers";

export class DashboardViewTreeItem extends AzExtParentTreeItem {
  public constructor(parent: AzExtParentTreeItem | undefined) {
    super(parent);
  }
  public async loadMoreChildrenImpl(_clearCache: boolean, _context: IActionContext): Promise<AzExtTreeItem[]> {
    return [
      new GenericTreeItem(this, {
        label: this.label,
        contextValue: this.contextValue,
        description: `${Constants.networkProtocols.http}${Constants.localhost}:${Constants.dashboardPort}`,
        iconPath: Constants.treeItemData.service.dashboard.iconPath,
      }),
    ];
  }
  public hasMoreChildrenImpl(): boolean {
    return false;
  }
  async refreshImpl(_: IActionContext): Promise<void> {
    throw new Error("Method not implemented.");
  }
  public label: string = Constants.treeItemData.service.dashboard.label;
  public contextValue: string = Constants.treeItemData.service.dashboard.contextValue;
}

/**
 * Register our dashboard view as:
 *  viewID: "truffle-vscode.views.dashboard"
 *  loadMore: ""truffle-vscode.views.dashboard.loadMore"
 *
 * @param viewId - the viewId - defaults to above.
 */
export function registerDashboardView(
  viewId: string = "truffle-vscode.views.dashboard"
): vscode.TreeView<AzExtTreeItem> {
  const root = new DashboardViewTreeItem(undefined);
  const treeDataProvider = new AzExtTreeDataProvider(root, `${viewId}.loadMore`);

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
    const rpc = `${Constants.networkProtocols.http}${Constants.localhost}:${Constants.dashboardPort}/rpc`;

    await vscodeEnvironment.writeToClipboard(rpc);
    vscode.window.showInformationMessage(Constants.informationMessage.rpcEndpointCopiedToClipboard);
  });

  return vscode.window.createTreeView(viewId, {treeDataProvider, canSelectMany: true});
}
