import {type TreeDataProvider, type TreeItem} from 'vscode';
import {OpenUrlTreeItem} from './lib/OpenUrlTreeItem';

/**
 * Provides the links for the **Help & Feedback** Tree View.
 */
export class HelpView implements TreeDataProvider<TreeItem> {
  private readonly items: TreeItem[];

  constructor() {
    this.items = [
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

  getTreeItem(element: TreeItem): TreeItem {
    return element;
  }

  getChildren(_element?: TreeItem): TreeItem[] {
    return this.items;
  }
}
