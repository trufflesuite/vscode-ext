import {AzExtParentTreeItem, AzExtTreeItem, IActionContext} from '@microsoft/vscode-azext-utils';
import {ThemeIcon} from 'vscode';
import {OpenUrlTreeItem} from './OpenUrlTreeItem';

export class HelpTreeItem extends AzExtParentTreeItem {
  public label = 'help';
  public contextValue = 'help';

  private values: AzExtTreeItem[];

  public constructor(parent: AzExtParentTreeItem | undefined) {
    super(parent);
    this.values = [
      this.readGettingStartedGuidTreeItem,
      this.readDocumentationTreeItem,
      this.getCodeSamplesExamplesTreeItem,
      this.reportAnIssueTreeItem,
      this.communityAndSupportTreeItem,
    ];
  }
  public async loadMoreChildrenImpl(_clear: boolean, _ctx: IActionContext): Promise<AzExtTreeItem[]> {
    return this.values;
  }
  public hasMoreChildrenImpl(): boolean {
    return false;
  }

  public compareChildrenImpl(item1: AzExtTreeItem, item2: AzExtTreeItem): number {
    // default sorting is based on the label which is being displayed to user.
    // use id to control the order being dispalyed
    return item1!.id!.localeCompare(item2!.id!);
  }

  private get readGettingStartedGuidTreeItem(): AzExtTreeItem {
    return new OpenUrlTreeItem(
      this,
      '0',
      'Getting Started Guide',
      'https://trufflesuite.com/blog/build-on-web3-with-truffle-vs-code-extension/',
      new ThemeIcon('star-full')
    );
  }
  private get readDocumentationTreeItem(): AzExtTreeItem {
    return new OpenUrlTreeItem(
      this,
      '10',
      'Extension Docs',
      'https://trufflesuite.com/docs/vscode-ext/',
      new ThemeIcon('book')
    );
  }

  private get getCodeSamplesExamplesTreeItem(): AzExtTreeItem {
    return new OpenUrlTreeItem(
      this,
      '20',
      'Get Code Samples & Example Projects',
      'https://trufflesuite.com/boxes/',
      new ThemeIcon('package')
    );
  }
  private get reportAnIssueTreeItem(): AzExtTreeItem {
    return new OpenUrlTreeItem(
      this,
      '30',
      'Report an Issue',
      'https://github.com/trufflesuite/vscode-ext/issues/new',
      new ThemeIcon('report')
    );
  }
  private get communityAndSupportTreeItem(): AzExtTreeItem {
    return new OpenUrlTreeItem(
      this,
      '40',
      'Community and Support',
      'https://trufflesuite.com/community/',
      new ThemeIcon('organization')
    );
  }
}
