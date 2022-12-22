import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as path from 'path';
import * as rimraf from 'rimraf';
import {getAllTruffleWorkspaces, type TruffleWorkspace} from '@/helpers/workspace';
import {
  type CancellationToken,
  type Disposable,
  type Event,
  EventEmitter,
  type FileChangeEvent,
  FileChangeType,
  FileSystemError,
  FileType,
  ThemeColor,
  ThemeIcon,
  type TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  Uri,
} from 'vscode';
import {Constants} from '@/Constants';
import {ContractService} from '@/services/contract/ContractService';

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
      return FileSystemError.FileNotFound();
    }

    if (error.code === 'EISDIR') {
      return FileSystemError.FileIsADirectory();
    }

    if (error.code === 'EEXIST') {
      return FileSystemError.FileExists();
    }

    if (error.code === 'EPERM' || error.code === 'EACCESS') {
      return FileSystemError.NoPermissions();
    }

    return error;
  }

  export function checkCancellation(token: CancellationToken): void {
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

class FileStat implements FileStat {
  constructor(private fsStat: fs.Stats) {}

  get type(): FileType {
    return this.fsStat.isFile()
      ? FileType.File
      : this.fsStat.isDirectory()
      ? FileType.Directory
      : this.fsStat.isSymbolicLink()
      ? FileType.SymbolicLink
      : FileType.Unknown;
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
type Entry = Uri & {
  type: FileType;
  label: string;
  iconPath: ThemeIcon;
  description?: string;

  /**
   * It offers a filter on the file explorer menu that filters action alternatives such as:
   * `Create Contract`, `Build Contracts`, `Build This Contract`, `Deploy Contracts` and `Debug Transaction`.
   *
   * These values are defined in `package.json`.
   */
  contextValue?: 'root' | 'folder' | 'file';

  truffleWorkspace: TruffleWorkspace;
};

export class FileSystemProvider implements TreeDataProvider<Entry | TreeItem> {
  private _onDidChangeFile: EventEmitter<FileChangeEvent[]>;
  private _onDidChangeTree: EventEmitter<(Entry | TreeItem)[] | void | null>;

  /**
   * @param _openFileCommand The command name for opening files
   */
  constructor(private _openFileCommand: string) {
    this._onDidChangeFile = new EventEmitter<FileChangeEvent[]>();
    this._onDidChangeTree = new EventEmitter<(Entry | TreeItem)[]>();
  }

  // Refresh full view
  public refresh(): void {
    this._onDidChangeTree.fire();
  }

  get onDidChangeFile(): Event<FileChangeEvent[]> {
    return this._onDidChangeFile.event;
  }

  get onDidChangeTreeData(): Event<(Entry | TreeItem)[] | void | null> {
    return this._onDidChangeTree.event;
  }

  watch(uri: Uri, options: {recursive: boolean; excludes: string[]}): Disposable {
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
                ? FileChangeType.Changed
                : (await _.exists(filepath))
                ? FileChangeType.Created
                : FileChangeType.Deleted,
            uri: uri.with({path: filepath}),
          } as FileChangeEvent,
        ]);
      }
    );

    return {dispose: () => watcher.close()};
  }

  stat(uri: Uri): FileStat | Thenable<FileStat> {
    return this._stat(uri.fsPath);
  }

  async _stat(path: string): Promise<FileStat> {
    return new FileStat(await _.stat(path));
  }

  readDirectory(uri: Uri): [string, FileType][] | Thenable<[string, FileType][]> {
    return this._readDirectory(uri);
  }

  async _readDirectory(uri: Uri): Promise<[string, FileType][]> {
    const children = await _.readdir(uri.fsPath);

    const result: [string, FileType][] = [];
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const stat = await this._stat(path.join(uri.fsPath, child));
      result.push([child, stat.type]);
    }

    return Promise.resolve(result);
  }

  createDirectory(uri: Uri): void | Thenable<void> {
    return _.mkdir(uri.fsPath);
  }

  readFile(uri: Uri): Uint8Array | Thenable<Uint8Array> {
    return _.readfile(uri.fsPath);
  }

  writeFile(uri: Uri, content: Uint8Array, options: {create: boolean; overwrite: boolean}): void | Thenable<void> {
    return this._writeFile(uri, content, options);
  }

  async _writeFile(uri: Uri, content: Uint8Array, options: {create: boolean; overwrite: boolean}): Promise<void> {
    const exists = await _.exists(uri.fsPath);
    if (!exists) {
      if (!options.create) {
        throw FileSystemError.FileNotFound();
      }

      await _.mkdir(path.dirname(uri.fsPath));
    } else {
      if (!options.overwrite) {
        throw FileSystemError.FileExists();
      }
    }

    return _.writefile(uri.fsPath, content as Buffer);
  }

  delete(uri: Uri, options: {recursive: boolean}): void | Thenable<void> {
    if (options.recursive) {
      return _.rmrf(uri.fsPath);
    }

    return _.unlink(uri.fsPath);
  }

  rename(oldUri: Uri, newUri: Uri, options: {overwrite: boolean}): void | Thenable<void> {
    return this._rename(oldUri, newUri, options);
  }

  async _rename(oldUri: Uri, newUri: Uri, options: {overwrite: boolean}): Promise<void> {
    const exists = await _.exists(newUri.fsPath);
    if (exists) {
      if (!options.overwrite) {
        throw FileSystemError.FileExists();
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
  async getChildren(element?: Entry): Promise<(Entry | TreeItem)[]> {
    if (element) {
      // Reads files and directories of the given element
      const children = await this.readDirectory(element);

      // Creates a new Entry for each child
      return children.map(
        ([name, type]): Entry =>
          Object.assign(Uri.file(path.join(element.fsPath, name)), {
            truffleWorkspace: element.truffleWorkspace,
            type,
            label: name,
            ...(type === FileType.Directory
              ? {
                  iconPath: new ThemeIcon('file-directory'),
                  contextValue: 'folder' as const,
                }
              : {
                  iconPath: new ThemeIcon('file-code'),
                  contextValue: 'file' as const,
                }),
          })
      );
    }

    // Gets the truffle workspaces
    const workspaces = getAllTruffleWorkspaces();

    // Checks if there are any truffle workspaces
    if (workspaces.length === 0) {
      return [
        {
          type: FileType.File,
          label: Constants.errorMessageStrings.TruffleConfigIsNotExist,
          iconPath: new ThemeIcon('warning', new ThemeColor('errorForeground')),
        },
      ];
    }

    const elements: Entry[] = [];

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
                truffleWorkspace: workspace,
                type: FileType.Directory,
                label: path.basename(contractFolder),
                iconPath: new ThemeIcon('file-directory'),
                description: path.basename(path.dirname(contractFolder)),
                contextValue: 'root' as const,
              })
            );
          }
        } catch (err) {
          // Adds the error to the tree view elements
          elements.push(
            Object.assign({
              type: FileType.File,
              label: (err as Error).message,
              iconPath: new ThemeIcon('warning', new ThemeColor('errorForeground')),
            })
          );
        }
      })
    );

    // Check if the elements are empty
    if (elements.length === 0) {
      // Adds the error to the tree view elements
      return [
        {
          type: FileType.File,
          label: 'There is no contract directory in this workspace',
          iconPath: new ThemeIcon('warning', new ThemeColor('errorForeground')),
        },
      ];
    }

    return elements;
  }

  getTreeItem(element: Entry): TreeItem {
    const treeItem = new TreeItem(
      element.label,
      element.type === FileType.Directory ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None
    );

    treeItem.iconPath = element.iconPath;
    treeItem.description = element.description;
    treeItem.contextValue = element.contextValue;

    if (element.fsPath && element.type === FileType.File) {
      treeItem.command = {command: this._openFileCommand, title: 'Open File', arguments: [element]};
    }

    return treeItem;
  }
}
