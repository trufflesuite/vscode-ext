import {resolveAllWorkspaces, WorkspaceType} from '@/helpers/AbstractWorkspace';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as path from 'path';
import * as rimraf from 'rimraf';
import * as vscode from 'vscode';
import {ThemeColor, ThemeIcon, Uri} from 'vscode';
import {Constants} from '@/Constants';
import {ContractService} from '@/services/contract/ContractService';

//#region Utilities

namespace _ {
  function handleResult<T>(
    resolve: (result: T) => void,
    reject: (error: Error) => void,
    error: Error | null | undefined,
    result: T
  ): void {
    if (error) {
      reject(massageError(error));
    } else {
      resolve(result);
    }
  }

  function massageError(error: Error & {code?: string}): Error {
    if (error.code === 'ENOENT') {
      return vscode.FileSystemError.FileNotFound();
    }

    if (error.code === 'EISDIR') {
      return vscode.FileSystemError.FileIsADirectory();
    }

    if (error.code === 'EEXIST') {
      return vscode.FileSystemError.FileExists();
    }

    if (error.code === 'EPERM' || error.code === 'EACCESS') {
      return vscode.FileSystemError.NoPermissions();
    }

    return error;
  }

  export function checkCancellation(token: vscode.CancellationToken): void {
    if (token.isCancellationRequested) {
      throw new Error('Operation cancelled');
    }
  }

  export function normalizeNFC(items: string): string;
  export function normalizeNFC(items: string[]): string[];
  export function normalizeNFC(items: string | string[]): string | string[] {
    if (process.platform !== 'darwin') {
      return items;
    }

    if (Array.isArray(items)) {
      return items.map((item) => item.normalize('NFC'));
    }

    return items.normalize('NFC');
  }

  export function readdir(path: string): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      fs.readdir(path, (error, children) => handleResult(resolve, reject, error, normalizeNFC(children)));
    });
  }

  export function stat(path: string): Promise<fs.Stats> {
    return new Promise<fs.Stats>((resolve, reject) => {
      fs.stat(path, (error, stat) => handleResult(resolve, reject, error, stat));
    });
  }

  export function readfile(path: string): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      fs.readFile(path, (error, buffer) => handleResult(resolve, reject, error, buffer));
    });
  }

  export function writefile(path: string, content: Buffer): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      fs.writeFile(path, content, (error) => handleResult(resolve, reject, error, void 0));
    });
  }

  export function exists(path: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      fs.exists(path, (exists) => handleResult(resolve, reject, null, exists));
    });
  }

  export function rmrf(path: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      rimraf.default(path, (error) => handleResult(resolve, reject, error, void 0));
    });
  }

  export function mkdir(path: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      mkdirp.default(path).catch((error) => handleResult(resolve, reject, error, void 0));
    });
  }

  export function rename(oldPath: string, newPath: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      fs.rename(oldPath, newPath, (error) => handleResult(resolve, reject, error, void 0));
    });
  }

  export function unlink(path: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      fs.unlink(path, (error) => handleResult(resolve, reject, error, void 0));
    });
  }
}

export class FileStat implements vscode.FileStat {
  constructor(private fsStat: fs.Stats) {}

  get type(): vscode.FileType {
    return this.fsStat.isFile()
      ? vscode.FileType.File
      : this.fsStat.isDirectory()
      ? vscode.FileType.Directory
      : this.fsStat.isSymbolicLink()
      ? vscode.FileType.SymbolicLink
      : vscode.FileType.Unknown;
  }

  get isFile(): boolean | undefined {
    return this.fsStat.isFile();
  }

  get isDirectory(): boolean | undefined {
    return this.fsStat.isDirectory();
  }

  get isSymbolicLink(): boolean | undefined {
    return this.fsStat.isSymbolicLink();
  }

  get size(): number {
    return this.fsStat.size;
  }

  get ctime(): number {
    return this.fsStat.ctime.getTime();
  }

  get mtime(): number {
    return this.fsStat.mtime.getTime();
  }
}

/**
 * Represents a tree item within our _Contract Explorer_ view.
 * It augments `Uri` with a `type` to indicate whether this `Entry`
 * is a file or a directory.
 * This can used to provide different contextual menu action according to `type`.
 *
 * @remarks
 *
 * The `Entry` type is defined as an
 * [Intersection Type](https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html#intersection-types)
 * to be _compatible_ with the
 * [VS Code Built-in File Explorer](https://code.visualstudio.com/docs/getstarted/userinterface#_explorer).
 *
 * The extension declares a few commands that can be invoked from both
 * the File Explorer's and Contract Explorer's contextual menus.
 * The [`explorer/context`](https://code.visualstudio.com/api/references/contribution-points#contributes.menus)
 * entry in `package.json` declares the commands
 * that can be invoked from the File Explorer's contextual menu.
 * When a menu is invoked through the File Explorer context menu,
 * the corresponding `Uri` is sent as the only argument to the command.
 * Therefore, by using a `Uri` intersection type,
 * the same commands can be invoked from both the File Explorer and the Contract Explorer.
 */
export type Entry = vscode.Uri & {
  type: vscode.FileType;
  label: string;
  iconPath: vscode.ThemeIcon;
  description?: string;
  contextValue?: string;
  workspaceType: WorkspaceType;
};

// /**
//  * Represents a top-level `TreeItem` for our file view...
//  *
//  * This gives us a few more free items in terms of customisation over the original view item.
//  */
// class TreeItemEntry extends TreeItem {
//   constructor(
//     path: string,
//     uri: vscode.Uri,
//     public readonly type: FileType,
//     description?: string,
//     icon?: vscode.ThemeIcon
//   ) {
//     super(path);
//     this.resourceUri = uri;
//     if (icon) this.iconPath = icon;
//     if (description) this.description = description;
//   }
// }

export type TElementTypes = {
  contextValue: string;
  type: vscode.FileType;
  isWorkspaceFolder: boolean;
};

//#endregion

export class FileSystemProvider implements vscode.TreeDataProvider<Entry>, vscode.FileSystemProvider {
  private _onDidChangeFile: vscode.EventEmitter<vscode.FileChangeEvent[]>;
  private _onDidChangeTree: vscode.EventEmitter<Entry[] | void | null>;
  private _elementTypes: TElementTypes[];

  /**
   * @param _openFileCommand The command name for opening files
   */
  constructor(private _openFileCommand: string) {
    this._onDidChangeFile = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
    this._onDidChangeTree = new vscode.EventEmitter<Entry[]>();
    this._elementTypes = this.getElementTypes();
  }

  // Refresh full view
  public refresh(): void {
    this._onDidChangeTree.fire();
  }

  /**
   * Sets the TreeItem element types.
   * These components are divided into three categories: root, folder, and file.
   * They are in charge of releasing action choices in TreeItem based on element type.
   *
   * @returns An Array of TElementTypes with its properties: ContextValue, Type and IsWorkspace.
   */
  getElementTypes(): TElementTypes[] {
    return [
      {
        contextValue: Constants.fileExplorerConfig.contextValue.root,
        type: vscode.FileType.Directory,
        isWorkspaceFolder: true,
      },
      {
        contextValue: Constants.fileExplorerConfig.contextValue.folder,
        type: vscode.FileType.Directory,
        isWorkspaceFolder: false,
      },
      {
        contextValue: Constants.fileExplorerConfig.contextValue.file,
        type: vscode.FileType.File,
        isWorkspaceFolder: false,
      },
    ];
  }

  get onDidChangeFile(): vscode.Event<vscode.FileChangeEvent[]> {
    return this._onDidChangeFile.event;
  }

  get onDidChangeTreeData(): vscode.Event<Entry[] | void | null> {
    return this._onDidChangeTree.event;
  }

  watch(uri: vscode.Uri, options: {recursive: boolean; excludes: string[]}): vscode.Disposable {
    const watcher = fs.watch(
      uri.fsPath,
      {recursive: options.recursive},
      async (event: string, filename: string | Buffer) => {
        const filepath = path.join(uri.fsPath, _.normalizeNFC(filename.toString()));
        // TODO support excludes (using minimatch library?)
        this._onDidChangeFile.fire([
          {
            type:
              event === 'change'
                ? vscode.FileChangeType.Changed
                : (await _.exists(filepath))
                ? vscode.FileChangeType.Created
                : vscode.FileChangeType.Deleted,
            uri: uri.with({path: filepath}),
          } as vscode.FileChangeEvent,
        ]);
      }
    );

    return {dispose: () => watcher.close()};
  }

  stat(uri: vscode.Uri): vscode.FileStat | Thenable<vscode.FileStat> {
    return this._stat(uri.fsPath);
  }

  async _stat(path: string): Promise<vscode.FileStat> {
    return new FileStat(await _.stat(path));
  }

  readDirectory(uri: vscode.Uri): [string, vscode.FileType][] | Thenable<[string, vscode.FileType][]> {
    return this._readDirectory(uri);
  }

  async _readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
    const children = await _.readdir(uri.fsPath);

    const result: [string, vscode.FileType][] = [];
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const stat = await this._stat(path.join(uri.fsPath, child));
      result.push([child, stat.type]);
    }

    return Promise.resolve(result);
  }

  createDirectory(uri: vscode.Uri): void | Thenable<void> {
    return _.mkdir(uri.fsPath);
  }

  readFile(uri: vscode.Uri): Uint8Array | Thenable<Uint8Array> {
    return _.readfile(uri.fsPath);
  }

  writeFile(
    uri: vscode.Uri,
    content: Uint8Array,
    options: {create: boolean; overwrite: boolean}
  ): void | Thenable<void> {
    return this._writeFile(uri, content, options);
  }

  async _writeFile(
    uri: vscode.Uri,
    content: Uint8Array,
    options: {create: boolean; overwrite: boolean}
  ): Promise<void> {
    const exists = await _.exists(uri.fsPath);
    if (!exists) {
      if (!options.create) {
        throw vscode.FileSystemError.FileNotFound();
      }

      await _.mkdir(path.dirname(uri.fsPath));
    } else {
      if (!options.overwrite) {
        throw vscode.FileSystemError.FileExists();
      }
    }

    return _.writefile(uri.fsPath, content as Buffer);
  }

  delete(uri: vscode.Uri, options: {recursive: boolean}): void | Thenable<void> {
    if (options.recursive) {
      return _.rmrf(uri.fsPath);
    }

    return _.unlink(uri.fsPath);
  }

  rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: {overwrite: boolean}): void | Thenable<void> {
    return this._rename(oldUri, newUri, options);
  }

  async _rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: {overwrite: boolean}): Promise<void> {
    const exists = await _.exists(newUri.fsPath);
    if (exists) {
      if (!options.overwrite) {
        throw vscode.FileSystemError.FileExists();
      } else {
        await _.rmrf(newUri.fsPath);
      }
    }

    const parentExists = await _.exists(path.dirname(newUri.fsPath));
    if (!parentExists) {
      await _.mkdir(path.dirname(newUri.fsPath));
    }
    return _.rename(oldUri.fsPath, newUri.fsPath);
  }

  // tree data provider
  async getChildren(element?: Entry): Promise<Entry[]> {
    if (element) {
      // Reads files and directories of the given element
      const children = await this.readDirectory(element);

      // Creates a new Entry for each child
      return children.map(([name, type]) =>
        Object.assign(vscode.Uri.file(path.join(element.fsPath, name)), {
          type,
          workspaceType: element.workspaceType,
          label: name,
          iconPath: type === vscode.FileType.Directory ? new ThemeIcon('file-directory') : new ThemeIcon('file-code'),
          contextValue: this.getTreeItemContextValue(type, false),
        })
      );
    }

    // The tree view elements
    const elements: Entry[] = [];

    // Gets the workspaces
    const workspaces = resolveAllWorkspaces();

    // FIXME: this error? needed?

    // Checks if there are any truffle workspaces
    if (workspaces.length === 0) {
      // Adds the error to the tree view elements
      elements.push(
        Object.assign({
          type: vscode.FileType.File,
          label: Constants.errorMessageStrings.TruffleConfigIsNotExist,
          iconPath: new ThemeIcon('warning', new ThemeColor('errorForeground')),
        })
      );

      return elements;
    }

    // Gets all contract folders from the truffle workspaces
    await Promise.all(
      workspaces.map(async (workspace) => {
        try {
          // Gets the contract folder
          const contractFolder = await ContractService.getContractsFolderPath(workspace);

          // Checks if the contract folder exists
          if (fs.existsSync(contractFolder)) {
            // Adds the contract folder to the tree view elements
            elements.push(
              Object.assign(Uri.parse(contractFolder), {
                type: vscode.FileType.Directory,
                workspaceType: workspace.workspaceType,
                label: path.basename(contractFolder),
                iconPath: new ThemeIcon('file-directory'),
                description: path.basename(path.dirname(contractFolder)) + ' - ' + workspace.workspaceType.toString(),
                contextValue: this.getTreeItemContextValue(vscode.FileType.Directory, true),
              })
            );
          }
        } catch (err) {
          const error = err as Error;
          // Adds the error to the tree view elements
          elements.push(
            Object.assign({
              type: vscode.FileType.File,
              label: error.message,
              iconPath: new ThemeIcon('warning', new ThemeColor('errorForeground')),
            })
          );
        }
      })
    );

    // Check if the elements are empty
    if (elements.length === 0) {
      // Adds the error to the tree view elements
      elements.push(
        Object.assign({
          type: vscode.FileType.File,
          label: Constants.errorMessageStrings.ContractFolderNotExists,
          iconPath: new ThemeIcon('warning', new ThemeColor('errorForeground')),
        })
      );
    }

    // Returns the elements
    return elements;
  }

  getTreeItem(element: Entry): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(
      element.label,
      element.type === vscode.FileType.Directory
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None
    );

    treeItem.iconPath = element.iconPath;
    treeItem.description = element.description;
    treeItem.contextValue = element.contextValue;

    if (element.fsPath && element.type === vscode.FileType.File) {
      treeItem.command = {command: this._openFileCommand, title: 'Open File', arguments: [element]};
    }

    return treeItem;
  }

  /**
   * Gets the context value from element according to the type: root, folder, or file.
   * The `context Value` offers a filter on the file explorer menu that filters action alternatives such as:
   * `Create Contract`, `Build Contracts`, `Build This Contract`, `Deploy Contracts` and `Debug Transaction`.
   *
   * @param type Enumeration of file types. The types File and Directory can also be a symbolic links, in that case use FileType.File | FileType.SymbolicLink and FileType.Directory | FileType.SymbolicLink.
   * @param isWorkspaceFolder Indicates if the element is a workspace folder.
   * @returns A string containing the contextValue property.
   */
  getTreeItemContextValue(type: vscode.FileType, isWorkspaceFolder: boolean): string {
    return this._elementTypes.find((ft) => ft.type === type && ft.isWorkspaceFolder === isWorkspaceFolder)!
      .contextValue;
  }
}

const openResource = (resource: vscode.Uri): void => {
  vscode.window.showTextDocument(resource);
};

export function registerFileExplorerView(
  commandPrefix = 'truffle-vscode',
  viewName = 'views.explorer'
): vscode.TreeView<Entry> {
  const openFileCommand = `${commandPrefix}.openFile`;
  const refreshExplorerCommand = `${commandPrefix}.${viewName}.refreshExplorer`;
  const treeDataProvider = new FileSystemProvider(openFileCommand);
  vscode.commands.registerCommand(openFileCommand, (resource) => openResource(resource));
  vscode.commands.registerCommand(refreshExplorerCommand, (_) => treeDataProvider.refresh());
  return vscode.window.createTreeView(`${commandPrefix}.${viewName}`, {treeDataProvider});
}
