import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export class ExplorerViewProvider implements vscode.TreeDataProvider<Dependency> {
  private _onDidChangeTreeData: vscode.EventEmitter<Dependency> = new vscode.EventEmitter();
  readonly onDidChangeTreeData: vscode.Event<Dependency> = this._onDidChangeTreeData.event;

  constructor(private workspaceRoot: string | undefined) {}

  refresh(dependency: Dependency): void {
    this._onDidChangeTreeData.fire(dependency);
  }

  getTreeItem(element: Dependency): vscode.TreeItem {
    return element;
  }

  getChildren(element?: Dependency): vscode.ProviderResult<Dependency[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage("No dependency Information in empty workspace");
      return [];
    }

    if (element) {
      return this.getDepsInPackageJson(path.join(this.workspaceRoot, "node_modules", element.label, "package.json"));
    } else {
      const packageJsonPath = path.join(this.workspaceRoot, "package.json");
      if (this.pathExists(packageJsonPath)) {
        return this.getDepsInPackageJson(packageJsonPath);
      } else {
        vscode.window.showInformationMessage("Workspace has no package.json");
        return [];
      }
    }
  }
  pathExists(p: string): boolean {
    try {
      fs.accessSync(p);
    } catch (err) {
      return false;
    }
    return true;
  }

  /**
   * Given the path to package.json, read all its dependencies and devDependencies.
   */
  private getDepsInPackageJson(packageJsonPath: string): Dependency[] {
    if (this.pathExists(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      const toDep = (moduleName: string, version: string): Dependency => {
        if (this.workspaceRoot && this.pathExists(path.join(this.workspaceRoot, "node_modules", moduleName))) {
          return new Dependency(moduleName, version, vscode.TreeItemCollapsibleState.Collapsed);
        } else {
          return new Dependency(moduleName, version, vscode.TreeItemCollapsibleState.None, {
            command: "extension.openPackageOnNpm",
            title: "Open on NPM",
            arguments: [moduleName],
          });
        }
      };

      const deps = packageJson.dependencies
        ? Object.keys(packageJson.dependencies).map((dep) => toDep(dep, packageJson.dependencies[dep]))
        : [];
      const devDeps = packageJson.devDependencies
        ? Object.keys(packageJson.devDependencies).map((dep) => toDep(dep, packageJson.devDependencies[dep]))
        : [];
      return deps.concat(devDeps);
    } else {
      return [];
    }
  }
}

export class Dependency extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    private readonly version: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);

    this.tooltip = `${this.label}-${this.version}`;
    this.description = this.version;
  }

  iconPath = {
    light: path.join(__filename, "..", "..", "resources", "light", "dependency.svg"),
    dark: path.join(__filename, "..", "..", "resources", "dark", "dependency.svg"),
  };

  contextValue = "dependency";
}
