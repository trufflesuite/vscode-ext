import {
  AzExtParentTreeItem,
  AzExtTreeDataProvider,
  AzExtTreeItem,
  GenericTreeItem,
  IActionContext,
} from "@microsoft/vscode-azext-utils";
import fs from "fs";
import paths from "path";
import vscode, {ThemeIcon} from "vscode";
import {getChain, getExplorerLink} from "../functions/explorer";
import {OpenUrlTreeItem} from "../Models/TreeItems/OpenUrlTreeItem";
import {getWorkspaceFolder, pathExists} from "./Utils";

const JSON_FILE_SUFFIX = ".json";

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
export abstract class DeploymentsViewTreeItemBase extends AzExtParentTreeItem {
  protected constructor(parent: AzExtParentTreeItem, protected contract: ContractBuildFile) {
    super(parent);
    this.iconPath = new ThemeIcon("briefcase");
  }

  public get contextValue(): string {
    return "Deployments";
  }
}
/*
     We want to add in some more items here I think. Or adapt the structure.

     Deployments:
      +----> [SmartContractName] (fileUrl.sol)
        +
        |
        |---> [NetworkName/ID] (rinkeby - 12)
        |      +
        |      |
        |      |---> [0x123123weqwdsd12312ee] - [url to etherscan/networkID]
        |
        |---> [NetworkName/ID] (ropsten - 11)
               +
               |
               |---> [0x123123weq22312312312] - [url to etherscan/networkID]

      Perhaps:
        Deployments:
          +----> [SmartContractName] (fileUrl.sol) (click to open build/contracts/file)
            - Updated At: "2022-03-30T01:22:56.252Z"
            - Network Type: ethereum,
            - Source: [...path] (click to open file)
            + Networks Deployed
            |
            |---> [NetworkName/ID] (rinkeby - 12)
            |      +
            |      |
            |      |---> [0x123123weqwdsd12312ee] - [url to etherscan/networkID]
                   |- more data



*/
// this is the root item in our tree view. We make a child list of items from our network deployment
export class ContractDeploymentViewTreeItem extends DeploymentsViewTreeItemBase {
  public constructor(parent: AzExtParentTreeItem, contract: ContractBuildFile) {
    super(parent, contract);
    this.iconPath = new ThemeIcon("file-code");
  }

  public get label(): string {
    return this.contract.contractName;
  }

  public async loadMoreChildrenImpl(_clearCache: boolean, _context: IActionContext): Promise<AzExtTreeItem[]> {
    const values = ContractDeploymentViewTreeItem.getNetworkObjects(this.contract);
    console.log("ContractDeploymentViewTreeItem.loadMoreChildrenImpl", {contract: this.contract, values});
    // TODO: once we have multiple networks we might need/want to adapt this to a factory method.
    return [
      new NetworkDeploymentsTreeItem(this, values),
      new GenericTreeItem(this, {
        label: `SourcePath: ${this.contract.sourcePath}`,
        contextValue: "sourcePath",
        iconPath: new ThemeIcon("link-external"),
      }),
      new GenericTreeItem(this, {
        label: `UpdatedAt: ${this.contract.updatedAt}`,
        contextValue: "updatedAt",
        iconPath: new ThemeIcon("clock"),
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
export class NetworkDeploymentsTreeItem extends AzExtParentTreeItem {
  public constructor(public parent: DeploymentsViewTreeItemBase, protected deployments: NetworkDeployment[]) {
    super(parent);
    this.iconPath = new ThemeIcon("symbol-class");
  }

  public get label(): string {
    return `Network Deployments: [${this.deployments.length}]`;
  }

  public get contextValue(): string {
    return "NetworkDeploymentsContext";
  }

  hasMoreChildrenImpl(): boolean {
    return false;
  }

  async loadMoreChildrenImpl(_clearCache: boolean, _context: IActionContext): Promise<AzExtTreeItem[]> {
    return await this.createTreeItemsWithErrorHandling(
      this.deployments,
      "invalidDeployments",
      (source) => new NetworkDeploymentTreeItem(this, source),
      (source) => "" + source?.networkId
    );
  }
}

// This has all the bits for our deployment. Network agnostic right now.
export class NetworkDeploymentTreeItem extends AzExtParentTreeItem {
  public constructor(public parent: AzExtParentTreeItem, protected deployment: NetworkDeployment) {
    super(parent);
    this.iconPath = new ThemeIcon("globe");
  }

  public get label(): string {
    return `${this.deployment.networkId} [${getChain(this.deployment.networkId).name}]`;
  }

  public get contextValue(): string {
    return "NetworkDeploymentContext";
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
        getExplorerLink(chainId, this.deployment.address, "address"),
        new ThemeIcon("output")
      ),
      new OpenUrlTreeItem(
        this,
        this.deployment.transactionHash,
        `txHash: ${this.deployment.transactionHash}`,
        getExplorerLink(chainId, this.deployment.transactionHash, "transaction"),
        new ThemeIcon("broadcast")
      ),
      // these need to be something else eventually
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

// This is the root of the view port.
export class DeploymentsView extends AzExtParentTreeItem {
  public static contextValue: string = "deployments";
  public contextValue: string = DeploymentsView.contextValue;
  public label: string = "Deployments";
  private readonly pathExists: boolean;
  private buildPath: string;

  public constructor(path: string, parent?: AzExtParentTreeItem) {
    super(parent);
    this.buildPath = "";
    // bit of fudging to get and validate path...
    const workspacePath = getWorkspaceFolder();
    if (workspacePath) {
      this.buildPath = paths.join(workspacePath.uri.fsPath, path);
    }
    this.pathExists = pathExists(this.buildPath);
    console.log("Setup Deployments view: ", {path, parent, pathExists: this.pathExists, buildPath: this.buildPath});
  }

  hasMoreChildrenImpl(): boolean {
    return false;
  }

  public async loadMoreChildrenImpl(_clearCache: boolean, _context: IActionContext): Promise<AzExtTreeItem[]> {
    if (this.pathExists) {
      const values = buildContractDeploymentsFromFolder(this.buildPath);
      console.log("Building Root with file values: ", {values});
      return await this.createTreeItemsWithErrorHandling(
        values,
        "invalidRegistryProvider",
        async (item) => new ContractDeploymentViewTreeItem(this, item),
        (cachedInfo) => cachedInfo.contractName
      );
    } else {
      return [
        new GenericTreeItem(this, {
          label: "No Contract Built/Deployed.",
          contextValue: "deployContracts",
          iconPath: new ThemeIcon("package"),
          includeInTreeItemPicker: true,
          commandId: "truffle-vscode.deployContracts",
        }),
      ];
    }
  }
}

const buildContractDeploymentsFromFolder = (path: string): ContractBuildFile[] => {
  return fs
    .readdirSync(path)
    .filter((f) => f.includes(JSON_FILE_SUFFIX))
    .map<ContractBuildFile>((f: string) => {
      const fullPath = paths.join(path, f);
      const jsonFile = JSON.parse(fs.readFileSync(fullPath, {encoding: "utf-8"}));
      return {
        path: fullPath,
        sourcePath: jsonFile.sourcePath,
        contractName: jsonFile.contractName,
        updatedAt: jsonFile.updatedAt,
        networkType: jsonFile.networkType,
        networks: jsonFile.networks,
      };
    });
};

export function registerDeploymentView(
  viewId: string = "truffle-vscode.views.deployments",
  baseFolder: string = "build/contracts"
): vscode.TreeView<AzExtTreeItem> {
  const root = new DeploymentsView(baseFolder, undefined);
  const treeDataProvider = new AzExtTreeDataProvider(root, `${viewId}.loadMore`);
  return vscode.window.createTreeView(viewId, {treeDataProvider, canSelectMany: true});
}
