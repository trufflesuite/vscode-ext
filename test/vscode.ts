import type vscode from 'vscode';
import type {CancellationToken, Progress, ProgressOptions} from 'vscode';

export enum ProgressLocation {
  SourceControl = 1,
  Window = 10,
  Notification = 15,
}

export enum ExtensionKind {
  UI = 1,
  Workspace = 2,
}

export enum TreeItemCollapsibleState {
  None = 0,
  Collapsed = 1,
  Expanded = 2,
}

export enum QuickPickItemKind {
  Separator = -1,
  Default = 0,
}

/**
 * Some bits for this implementation were taken from
 *
 * https://github.com/microsoft/vscode-uri
 */
export class Uri implements vscode.Uri {
  private static readonly _REGEXP = /^(([^:/?#]+?):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/;

  scheme: string;
  authority: string;
  path: string;
  query: string;
  fragment: string;

  private constructor(scheme: string, authority?: string, path?: string, query?: string, fragment?: string) {
    this.scheme = scheme;
    this.authority = authority || '';
    this.path = path || '';
    this.path = Uri._referenceResolution(this.scheme, path || '');

    this.query = query || '';
    this.fragment = fragment || '';
  }

  get fsPath(): string {
    return this.path;
  }

  with(change: {
    scheme?: string | undefined;
    authority?: string | undefined;
    path?: string | undefined;
    query?: string | undefined;
    fragment?: string | undefined;
  }): Uri {
    return new Uri(
      change.scheme || this.scheme,
      change.authority || this.authority,
      change.path || this.path,
      change.query || this.query,
      change.fragment || this.fragment
    );
  }

  toString(_skipEncoding?: boolean | undefined): string {
    return (
      this.scheme +
      '://' +
      this.path +
      (this.query ? '?' + this.query : '') +
      (this.fragment ? '#' + this.fragment : '')
    );
  }

  toJSON(): this {
    return this;
  }

  public static file(path: string): Uri {
    return new Uri('file', '', path);
  }

  public static parse(path: string): Uri {
    // const comps = path.match(/([a-z]+):\/\/([^?#]+)(\?([^#]+)|())(#(.+)|())/)!;
    // return new Uri(comps[1], '', comps[2], comps[4], comps[6]);

    const match = Uri._REGEXP.exec(path)!;
    // if (!match) {
    // 	return new Uri(_empty, _empty, _empty, _empty, _empty);
    // }
    return new Uri(match[2], match[4], match[5], match[7], match[9]);
  }

  // implements a bit of https://tools.ietf.org/html/rfc3986#section-5
  static _referenceResolution(scheme: string, path: string): string {
    // the slash-character is our 'default base' as we don't
    // support constructing URIs relative to other URIs. This
    // also means that we alter and potentially break paths.
    // see https://tools.ietf.org/html/rfc3986#section-5.1.4
    switch (scheme) {
      case 'https':
      case 'http':
      case 'file':
        if (!path) {
          path = '/';
        } else if (path[0] !== '/') {
          path = '/' + path;
        }
        break;
    }
    return path;
  }
}

export class ThemeIcon implements ThemeIcon {
  constructor(readonly id: string, readonly color?: vscode.ThemeColor) {}
}

export class TreeItem implements TreeItem {
  constructor(readonly resourceUri: Uri, readonly collapsibleState?: vscode.TreeItemCollapsibleState) {}
}

export class EventEmitter {
  event?: vscode.Event<any>;

  fire(_data: unknown): void {
    throw new Error('Method not implemented.');
  }
  dispose(): void {
    throw new Error('Method not implemented.');
  }
}

export const workspace = {
  workspaceFolders: undefined as vscode.WorkspaceFolder[] | undefined,

  getConfiguration: function (_section?: string): vscode.WorkspaceConfiguration {
    return {
      get: function (_section: string) {
        return undefined;
      },
    } as any;
  },

  getWorkspaceFolder: function (_uri: Uri): vscode.WorkspaceFolder | undefined {
    return workspace.workspaceFolders![0];
  },

  updateWorkspaceFolders(
    _start: number,
    _deleteCount: number | undefined | null,
    ..._workspaceFoldersToAdd: {readonly uri: Uri; readonly name?: string}[]
  ): boolean {
    return false;
  },
};

export namespace commands {
  export const executeCommand = (): Promise<void> => Promise.resolve();
}

export namespace extensions {
  export function getExtension(_extensionId: string): vscode.Extension<any> | undefined {
    return {
      packageJSON: {},
    } as any;
  }
}

let clipboardContent = '';

export const env = {
  clipboard: {
    readText: () => Promise.resolve(clipboardContent),
    writeText: (value) => {
      clipboardContent = value;
      return Promise.resolve();
    },
  } as vscode.Clipboard,
};

export const window = {
  createOutputChannel: function (_name: string): vscode.OutputChannel {
    return {
      appendLine: function (_value: string) {
        return null;
      },
      append: () => null,
      show: () => null,
    } as any;
  },

  //export function showInputBox(options?: InputBoxOptions, token?: CancellationToken): Thenable<string | undefined>;
  showInputBox: (): null => null,
  showQuickPick: (): null => null,
  showOpenDialog: (): null => null,
  showSaveDialog: (): null => null,
  showErrorMessage: (): null => null,
  showInformationMessage: (): null => null,
  withProgress: function <R>(
    _options: ProgressOptions,
    _task: (progress: Progress<{message?: string; increment?: number}>, _token: CancellationToken) => Thenable<R>
  ): Thenable<R> {
    // try {
    return _task({report: (_) => null}, null as any);
    // } catch (err) {

    //
    // }
  },
};

export const debug = {
  startDebugging: (): null => null,
};
