import {AzExtTreeDataProvider, AzExtTreeItem, IActionContext, registerCommand} from '@microsoft/vscode-azext-utils';
import {HelpTreeItem} from '../Models/TreeItems/HelpTreeItem';
import * as vscode from 'vscode';
import {OpenUrlTreeItem} from '../Models/TreeItems/OpenUrlTreeItem';

/**
 * Function to register our help view for us.
 *
 * @param viewId the id of the view, defaults
 * @returns The tree view for use/subscribing in the main extension code.
 */
export function registerHelpView(viewId = 'truffle-vscode.views.help'): vscode.TreeView<AzExtTreeItem> {
  const helpRoot = new HelpTreeItem(undefined);
  const helpTreeDataProvider = new AzExtTreeDataProvider(helpRoot, 'truffle-vscode.views.help.loadMore');
  // register the opening command.
  registerCommand('truffle-vscode.openUrl', async (_: IActionContext, node: OpenUrlTreeItem) => node.openUrl());
  return vscode.window.createTreeView(viewId, {treeDataProvider: helpTreeDataProvider, canSelectMany: false});
}
