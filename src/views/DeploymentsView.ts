// Copyright (c) 2022. Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {getChain, getExplorerLink} from '@/functions/explorer';
import {AbstractWorkspace, resolveAllWorkspaces, WorkspaceType} from '@/helpers/AbstractWorkspace';
import {EvalTruffleConfigError} from '@/helpers/TruffleConfiguration';
import {Output, OutputLabel} from '@/Output';
import {ContractService} from '@/services/contract/ContractService';
import fs from 'fs';
import paths from 'path';
import {
  Command,
  commands,
  Event,
  EventEmitter,
  ThemeColor,
  ThemeIcon,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  TreeView,
  Uri,
  window,
} from 'vscode';
import {OpenUrlTreeItem} from './lib/OpenUrlTreeItem';

/**
 * Represents a compiled or deployed contract.
 *
 * See https://github.com/trufflesuite/truffle/tree/master/packages/contract-schema
 */
interface ContractBuildFile {
  /**
   * The original path where the `json` file was read from.
   */
  readonly path: string;

  /**
   * File path for uncompiled source code.
   *
   * See https://github.com/trufflesuite/truffle/tree/master/packages/contract-schema#sourcepath.
   */
  readonly sourcePath: string;

  /**
   * Name used to identify the contract.
   *
   * See https://github.com/trufflesuite/truffle/tree/master/packages/contract-schema#contractname.
   */
  readonly contractName: string;

  /**
   * Time at which contract object representation was generated/most recently updated.
   *
   * See https://github.com/trufflesuite/truffle/tree/master/packages/contract-schema#updatedat.
   */
  readonly updatedAt: string;

  /**
   * Specific blockchain network type targeted.
   *
   * See https://github.com/trufflesuite/truffle/tree/master/packages/contract-schema#networktype.
   */
  readonly networkType: string;

  /**
   * Listing of contract instances.
   * Object mapping network ID keys to network object values.
   * Includes address information, links to other contract instances, and/or contract event logs.
   *
   * See https://github.com/trufflesuite/truffle/tree/master/packages/contract-schema#networks.
   */
  readonly networks: Record<string, NetworkDeployment>;
}

/**
 * Represents a contract instance deployment.
 *
 * See https://github.com/trufflesuite/truffle/blob/master/packages/contract-schema/network-object.spec.md.
 */
interface NetworkDeployment {
  /**
   * The network ID where this contract was deployed to.
   */
  networkId: number;

  /**
   * Ethereum Contract JSON ABI item representing an EVM output log event for a contract.
   * Matches objects with "type": "event" in the JSON ABI.
   *
   * See https://github.com/trufflesuite/truffle/blob/master/packages/contract-schema/network-object.spec.md#events.
   */
  events: Record<any, any>;

  /**
   * Listing of dependent contract instances and their events.
   * Facilitates the resolution of link references for a particular contract to instances of other contracts.
   * Object mapping linked contract names to objects representing an individual link.
   *
   * See https://github.com/trufflesuite/truffle/blob/master/packages/contract-schema/network-object.spec.md#links.
   */
  links: Record<any, any>;

  /**
   * The contract instance's primary identifier on the network. 40 character long hexadecimal string, prefixed by 0x.
   *
   * See https://github.com/trufflesuite/truffle/blob/master/packages/contract-schema/network-object.spec.md#address.
   */
  address: string;

  /**
   * The transaction hash where this contract was deployed.
   */
  transactionHash: string;
}

/**
 * Represents a `TreeItem` that contains children.
 */
interface TreeParentItem {
  /**
   * Loads the children of this `TreeItem`.
   */
  loadChildren(): TreeItem[];
}

/**
 * Represents a top-level `TreeItem` when more than one Truffle config files
 * are found in the workbench.
 *
 * It uses the `dirName` and `truffleConfigName` from `truffleWorkspace`
 * as `label` and `description` for the `TreeItem` respectively.
 */
class TruffleWorkspaceTreeItem extends TreeItem implements TreeParentItem {
  constructor(workspace: AbstractWorkspace, private readonly items: TreeItem[]) {
    super(workspace.dirName);
    this.iconPath = new ThemeIcon('target');
    this.description = workspace.configName;
    this.collapsibleState = TreeItemCollapsibleState.Expanded;
  }

  loadChildren(): TreeItem[] {
    return this.items;
  }
}

/**
 * Represents a compiled, and maybe deployed contract.
 * It adds the contract's network deployments as child tree items.
 * Moreover, it includes links to open both the source and the compiled contract.
 * Finally, it includes its last updated timestamp.
 */
class ContractDeploymentTreeItem extends TreeItem implements TreeParentItem {
  constructor(readonly contract: ContractBuildFile) {
    super(contract.contractName);
    this.iconPath = new ThemeIcon('file-code');
    this.collapsibleState = TreeItemCollapsibleState.Collapsed;
  }

  public loadChildren(): TreeItem[] {
    const values = ContractDeploymentTreeItem.getNetworkObjects(this.contract);
    // TODO: once we have multiple networks we might need/want to adapt this to a factory method.
    return [
      {
        label: `Contract: ${this.contract.sourcePath}`,
        command: openFileCommand(Uri.file(this.contract.sourcePath)),
        iconPath: new ThemeIcon('link-external'),
      },
      {
        label: `Deployment JSON: ${this.contract.path}`,
        command: openFileCommand(Uri.file(this.contract.path)),
        iconPath: new ThemeIcon('json'),
      },
      {
        label: `UpdatedAt: ${this.contract.updatedAt}`,
        iconPath: new ThemeIcon('clock'),
      },
      new NetworkDeploymentsTreeItem(values),
    ];
  }

  private static getNetworkObjects(contract: ContractBuildFile): NetworkDeployment[] {
    return Object.entries(contract.networks).map<NetworkDeployment>((value) => ({
      ...value[1],
      networkId: Number(value[0]),
    }));
  }
}

/**
 * Wrapper node for deployments.
 */
class NetworkDeploymentsTreeItem extends TreeItem implements TreeParentItem {
  public constructor(protected deployments: NetworkDeployment[]) {
    super(`Network Deployments: [${deployments.length}]`);
    this.iconPath = new ThemeIcon('symbol-class');
    this.collapsibleState = TreeItemCollapsibleState.Collapsed;
  }

  loadChildren(): TreeItem[] {
    return this.deployments.map((deployment) => new NetworkDeploymentTreeItem(deployment));
  }
}

/**
 * This has all the bits for our deployment.
 * Network agnostic right now.
 */
class NetworkDeploymentTreeItem extends TreeItem implements TreeParentItem {
  public constructor(protected deployment: NetworkDeployment) {
    super(`${deployment.networkId} [${getChain(deployment.networkId).name}]`);
    this.iconPath = new ThemeIcon('globe');
    this.collapsibleState = TreeItemCollapsibleState.Collapsed;
  }

  loadChildren(): TreeItem[] {
    const chainId: number = this.deployment.networkId;
    return [
      new OpenUrlTreeItem(
        `Address: ${this.deployment.address}`,
        getExplorerLink(chainId, this.deployment.address, 'address'),
        'output'
      ),
      new OpenUrlTreeItem(
        `txHash: ${this.deployment.transactionHash}`,
        getExplorerLink(chainId, this.deployment.transactionHash, 'transaction'),
        'broadcast'
      ),
      // TODO: these need to be something else eventually
      // new GenericTreeItem(this, {
      //   label: `Events: ${JSON.stringify(this.deployment.events)}`,
      //   iconPath: new ThemeIcon("files"),
      // }),
      // new GenericTreeItem(this, {
      //   label: `Links: ${JSON.stringify(this.deployment.links)}`,
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
class DeploymentsView implements TreeDataProvider<TreeItem> {
  readonly _onDidChangeTree = new EventEmitter<TreeItem[] | void>();

  get onDidChangeTreeData(): Event<TreeItem[] | void | null> {
    return this._onDidChangeTree.event;
  }

  refresh() {
    this._onDidChangeTree.fire();
  }

  getTreeItem(element: TreeItem): TreeItem | Thenable<TreeItem> {
    return element;
  }

  async getChildren(element?: TreeItem | undefined): Promise<TreeItem[]> {
    if (element) {
      return (element as TreeParentItem).loadChildren();
    }

    // just the truffle ones maam.
    const workspaces = resolveAllWorkspaces().filter((ws) => ws.workspaceType === WorkspaceType.TRUFFLE);
    if (workspaces.length === 0) {
      return [];
    } else if (workspaces.length === 1) {
      return await getContractDeployments(workspaces[0]);
    } else {
      return await Promise.all(
        workspaces.map(async (ws) => new TruffleWorkspaceTreeItem(ws, await getContractDeployments(ws)))
      );
    }
  }
}

/**
 * Gets the compiled contracts for the given `truffleWorkspace`.
 * It follows the `contracts_build_directory` property in the Truffle config file
 * to look for compiled artifacts.
 *
 * @param workspace the Truffle config file where to look for compiled contracts.
 * @returns an array of `TreeItem` that represents the compiled contracts.
 */
async function getContractDeployments(workspace: AbstractWorkspace): Promise<TreeItem[]> {
  let buildPath: string;

  try {
    buildPath = await ContractService.getBuildFolderPath(workspace);
  } catch (err) {
    if (err instanceof EvalTruffleConfigError) {
      Output.outputLine(
        OutputLabel.truffleForVSCode,
        `Error while loading Deployments from ${workspace.dirName}:${workspace.configName}. Reason:`
      );
      Output.outputLine(OutputLabel.truffleForVSCode, err.reason);
    }
    const error = err as Error;
    return [
      {
        label: error.message,
        iconPath: new ThemeIcon('warning', new ThemeColor('errorForeground')),
        command: openFileCommand(workspace.configPath),
      },
    ];
  }

  if (pathExists(buildPath)) {
    const values = buildContractDeploymentsFromFolder(buildPath);
    return values.map((item) => new ContractDeploymentTreeItem(item));
  } else {
    return [
      {
        label: 'No Contract Built/Deployed.',
        iconPath: new ThemeIcon('package'),
      },
    ];
  }
}

/**
 * Loads all `json` files from `path`,
 * and transforms each one into a `ContractBuildFile`.
 *
 * @param path where to load `json` files from.
 * @returns
 */
function buildContractDeploymentsFromFolder(path: string): ContractBuildFile[] {
  return fs
    .readdirSync(path)
    .filter((f) => f.includes('.json'))
    .map<ContractBuildFile>((f) => {
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
 * Determines whether `path` exists.
 *
 * @param path the path to test.
 * @returns `true` if the `path` exists. Otherwise, `false`.
 */
function pathExists(path: string): boolean {
  try {
    fs.accessSync(path);
    return true;
  } catch (_err) {
    return false;
  }
}

/**
 * Creates a `Command` that opens the given `fileUri`.
 * The resulting command `Command` is suitable for a `TreeItem`,
 * that is, it has an empty `title`.
 *
 * To open the given `fileUri`, it uses the custom `truffle-vscode.openFile` command.
 */
function openFileCommand(fileUri: Uri): Command {
  return {
    title: '',
    command: 'truffle-vscode.openFile',
    arguments: [fileUri],
  };
}

/**
 * Register our deployments view as:
 *  viewID: "truffle-vscode.views.deployments"
 *  refresh: "truffle-vscode.views.deployments.refresh"
 *  loadMore: ""truffle-vscode.views.deployments.loadMore"
 *
 * @param viewId - the viewId - defaults to above.
 */
export function registerDeploymentView(viewId: string): TreeView<TreeItem> {
  const treeDataProvider = new DeploymentsView();
  commands.registerCommand(`${viewId}.refresh`, () => {
    treeDataProvider.refresh();
  });

  return window.createTreeView(viewId, {treeDataProvider, canSelectMany: true});
}
