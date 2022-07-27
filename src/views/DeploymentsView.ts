import {
  AzExtParentTreeItem,
  AzExtTreeDataProvider,
  AzExtTreeItem,
  GenericTreeItem,
  IActionContext,
} from '@microsoft/vscode-azext-utils';
import fs from 'fs';
import paths from 'path';
import vscode, {commands, ThemeIcon, Uri} from 'vscode';
import {getChain, getExplorerLink} from '../functions/explorer';
import {OpenFileTreeItem} from '../Models/TreeItems/OpenFileTreeItem';
import {OpenUrlTreeItem} from '../Models/TreeItems/OpenUrlTreeItem';
import {pathExists} from './Utils';
import {ContractService} from '@/services/contract/ContractService';

const JSON_FILE_SUFFIX = '.json';

interface NetworkDeployment {
  networkId: number;
  events: Record<any, any>;
  links: Record<any, any>;
  address: string;
  transactionHash: string;
}

interface ContractBuildFile {
  readonly path: string;
  readonly sourcePath: string;
  readonly contractName: string;
  readonly updatedAt: string;
  readonly networkType: string;
  readonly networks: Record<string, NetworkDeployment>;
}

// This is the view class for the trees. Maybe redundant
abstract class DeploymentsViewTreeItemBase extends AzExtParentTreeItem {
  protected constructor(parent: AzExtParentTreeItem, protected contract: ContractBuildFile) {
    super(parent);
    this.iconPath = new ThemeIcon('briefcase');
  }

  public get contextValue(): string {
    return 'Deployments';
  }
}

// this is the root item in our tree view. We make a child list of items from our network deployment
class ContractDeploymentViewTreeItem extends DeploymentsViewTreeItemBase {
  constructor(parent: AzExtParentTreeItem, contract: ContractBuildFile) {
    super(parent, contract);
    this.iconPath = new ThemeIcon('file-code');
    // setup the file opening commands.
    this.commandId = 'truffle-vscode.openFile';
    this.commandArgs = [Uri.file(contract.sourcePath)];
  }

  public get label(): string {
    return this.contract.contractName;
  }

  public async loadMoreChildrenImpl(_clearCache: boolean, _context: IActionContext): Promise<AzExtTreeItem[]> {
    const values = ContractDeploymentViewTreeItem.getNetworkObjects(this.contract);
    // TODO: once we have multiple networks we might need/want to adapt this to a factory method.
    return [
      new NetworkDeploymentsTreeItem(this, values),
      new OpenFileTreeItem(this, {
        label: `Contract: ${this.contract.sourcePath}`,
        commandId: 'truffle-vscode.openFile',
        commandArgs: [Uri.file(this.contract.sourcePath)],
        contextValue: 'sourcePath',
        iconPath: new ThemeIcon('link-external'),
      }),
      new OpenFileTreeItem(this, {
        label: `Deployment JSON: ${this.contract.path}`,
        commandId: 'truffle-vscode.openFile',
        commandArgs: [Uri.file(this.contract.path)],
        contextValue: 'contractBuildPath',
        iconPath: new ThemeIcon('json'),
      }),
      new GenericTreeItem(this, {
        label: `UpdatedAt: ${this.contract.updatedAt}`,
        contextValue: 'updatedAt',
        iconPath: new ThemeIcon('clock'),
      }),
    ];
  }

  private static getNetworkObjects(contract: ContractBuildFile): NetworkDeployment[] {
    return Object.entries(contract.networks).map<NetworkDeployment>((value) => ({
      ...value[1],
      networkId: Number(value[0]),
    }));
  }

  // TODO fix the ordering here...
  compareChildrenImpl(item1: AzExtTreeItem, item2: AzExtTreeItem): number {
    return super.compareChildrenImpl(item1, item2);
  }

  public hasMoreChildrenImpl(): boolean {
    return false;
  }
}

// wrapper node for deployments
class NetworkDeploymentsTreeItem extends AzExtParentTreeItem {
  public constructor(public parent: DeploymentsViewTreeItemBase, protected deployments: NetworkDeployment[]) {
    super(parent);
    this.iconPath = new ThemeIcon('symbol-class');
  }

  public get label(): string {
    return `Network Deployments: [${this.deployments.length}]`;
  }

  public get contextValue(): string {
    return 'NetworkDeploymentsContext';
  }

  hasMoreChildrenImpl(): boolean {
    return false;
  }

  async loadMoreChildrenImpl(_clearCache: boolean, _context: IActionContext): Promise<AzExtTreeItem[]> {
    return await this.createTreeItemsWithErrorHandling(
      this.deployments,
      'invalidDeployments',
      (source) => new NetworkDeploymentTreeItem(this, source),
      (source) => '' + source?.networkId
    );
  }
}

// This has all the bits for our deployment. Network agnostic right now.
class NetworkDeploymentTreeItem extends AzExtParentTreeItem {
  public constructor(public parent: AzExtParentTreeItem, protected deployment: NetworkDeployment) {
    super(parent);
    this.iconPath = new ThemeIcon('globe');
  }

  public get label(): string {
    return `${this.deployment.networkId} [${getChain(this.deployment.networkId).name}]`;
  }

  public get contextValue(): string {
    return 'NetworkDeploymentContext';
  }

  hasMoreChildrenImpl(): boolean {
    return false;
  }

  async loadMoreChildrenImpl(_clearCache: boolean, _context: IActionContext): Promise<AzExtTreeItem[]> {
    const chainId: number = this.deployment.networkId;
    return [
      new OpenUrlTreeItem(
        this,
        this.deployment.address,
        `Address: ${this.deployment.address}`,
        getExplorerLink(chainId, this.deployment.address, 'address'),
        new ThemeIcon('output')
      ),
      new OpenUrlTreeItem(
        this,
        this.deployment.transactionHash,
        `txHash: ${this.deployment.transactionHash}`,
        getExplorerLink(chainId, this.deployment.transactionHash, 'transaction'),
        new ThemeIcon('broadcast')
      ),
      // TODO: these need to be something else eventually
      // new GenericTreeItem(this, {
      //   label: `Events: ${JSON.stringify(this.deployment.events)}`,
      //   contextValue: "events",
      //   iconPath: new ThemeIcon("files"),
      // }),
      // new GenericTreeItem(this, {
      //   label: `Links: ${JSON.stringify(this.deployment.links)}`,
      //   contextValue: "links",
      //   iconPath: new ThemeIcon("references"),
      // }),
    ];
  }
}

/**
 * This class provides the items for the **Deployments** [Tree View](https://code.visualstudio.com/api/extension-guides/tree-view).
 * It displays the compiled or deployed contracts.
 * It uses the [`contracts_build_directory`](https://trufflesuite.com/docs/truffle/reference/configuration/#contracts_build_directory)
 * property to read the artifacts from.
 *
 * The view displays tree items with the following structure.
 *
 *    We want to add in some more items here I think. Or adapt the structure.
 *
 * ```
 *    Deployments:
 *     +----> [SmartContractName] (fileUrl.sol)
 *       +
 *       |
 *       |---> [NetworkName/ID] (rinkeby - 12)
 *       |      +
 *       |      |
 *       |      |---> [0x123123weqwdsd12312ee] - [url to etherscan/networkID]
 *       |
 *       |---> [NetworkName/ID] (ropsten - 11)
 *              +
 *              |
 *              |---> [0x123123weq22312312312] - [url to etherscan/networkID]
 * ```
 *
 *     Perhaps:
 *
 * ```
 * Deployments
 * +--> [SmartContractName] (fileUrl.sol) (click to open build/contracts/file)
 *      - Updated At: "2022-03-30T01:22:56.252Z"
 *      - Network Type: ethereum,
 *      - Source: [...path] (click to open file)
 *     + Networks Deployed
 *     |
 *     |---> [NetworkName/ID] (rinkeby - 12)
 *     |      +
 *     |      |
 *     |      |---> [0x123123weqwdsd12312ee] - [url to etherscan/networkID]
 *            |- more data
 * ```
 *
 */
class DeploymentsView extends AzExtParentTreeItem {
  public contextValue = 'deployments';
  public label = 'Deployments';

  public constructor() {
    super(undefined);
  }

  hasMoreChildrenImpl(): boolean {
    return false;
  }

  public async loadMoreChildrenImpl(_clearCache: boolean, _context: IActionContext): Promise<AzExtTreeItem[]> {
    let buildPath: string;

    try {
      buildPath = await ContractService.getBuildFolderPath();
    } catch (err) {
      return [];
    }

    if (pathExists(buildPath)) {
      const values = buildContractDeploymentsFromFolder(buildPath);
      return await this.createTreeItemsWithErrorHandling(
        values,
        'invalidRegistryProvider',
        async (item) => new ContractDeploymentViewTreeItem(this, item),
        (cachedInfo) => cachedInfo.contractName
      );
    } else {
      return [
        new GenericTreeItem(this, {
          label: 'No Contract Built/Deployed.',
          contextValue: 'deployContracts',
          iconPath: new ThemeIcon('package'),
        }),
      ];
    }
  }
}

function buildContractDeploymentsFromFolder(path: string): ContractBuildFile[] {
  return fs
    .readdirSync(path)
    .filter((f) => f.includes(JSON_FILE_SUFFIX))
    .map<ContractBuildFile>((f: string) => {
      const fullPath = paths.join(path, f);
      const jsonFile = JSON.parse(fs.readFileSync(fullPath, {encoding: 'utf-8'}));
      return {
        path: fullPath,
        sourcePath: jsonFile.sourcePath,
        contractName: jsonFile.contractName,
        updatedAt: jsonFile.updatedAt,
        networkType: jsonFile.networkType,
        networks: jsonFile.networks,
      };
    });
}

/**
 * Register our deployments view as:
 *  viewID: "truffle-vscode.views.deployments"
 *  refresh: "truffle-vscode.views.deployments.refresh"
 *  loadMore: ""truffle-vscode.views.deployments.loadMore"
 *
 * @param viewId - the viewId - defaults to above.
 */
export function registerDeploymentView(viewId: string): vscode.TreeView<AzExtTreeItem> {
  const root = new DeploymentsView();
  const treeDataProvider = new AzExtTreeDataProvider(root, `${viewId}.loadMore`);
  commands.registerCommand(`${viewId}.refresh`, async (context: IActionContext, node?: AzExtTreeItem) => {
    await treeDataProvider.refresh(context, node);
  });

  return vscode.window.createTreeView(viewId, {treeDataProvider, canSelectMany: true});
}
