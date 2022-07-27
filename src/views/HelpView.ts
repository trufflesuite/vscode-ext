import {Event, ProviderResult, TreeDataProvider, TreeView, TreeItem, window} from 'vscode';
import {OpenUrlTreeItem} from './lib/OpenUrlTreeItem';

class HelpView implements TreeDataProvider<TreeItem> {
  private values: TreeItem[];

  constructor() {
    this.values = [
      new OpenUrlTreeItem(
        'Getting Started Guide',
        'https://trufflesuite.com/blog/build-on-web3-with-truffle-vs-code-extension/',
        'star-full'
      ),
      new OpenUrlTreeItem('Extension Docs', 'https://trufflesuite.com/docs/vscode-ext/', 'book'),
      new OpenUrlTreeItem('Get Code Samples & Example Projects', 'https://trufflesuite.com/boxes/', 'package'),
      new OpenUrlTreeItem('Report an Issue', 'https://github.com/trufflesuite/vscode-ext/issues/new', 'report'),
      new OpenUrlTreeItem('Community and Support', 'https://trufflesuite.com/community/', 'organization'),
    ];
  }

  onDidChangeTreeData?: Event<void | TreeItem | TreeItem[] | null | undefined> | undefined;

  getTreeItem(element: TreeItem): TreeItem | Thenable<TreeItem> {
    return element;
  }

  getChildren(_element?: TreeItem | undefined): ProviderResult<TreeItem[]> {
    return this.values;
  }
}

/**
 * Function to register our help view for us.
 *
 * @param viewId the id of the view, defaults
 * @returns The tree view for use/subscribing in the main extension code.
 */
export function registerHelpView(viewId: string): TreeView<TreeItem> {
  const treeDataProvider = new HelpView();
  return window.createTreeView(viewId, {treeDataProvider, canSelectMany: false});
}
