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
    this.query = query || '';
    this.fragment = fragment || '';
  }

  get fsPath() {
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

  toJSON() {
    return this;
  }

  public static file(path: string) {
    return new Uri('file', '', path);
  }

  public static parse(path: string) {
    // const comps = path.match(/([a-z]+):\/\/([^?#]+)(\?([^#]+)|())(#(.+)|())/)!;
    // return new Uri(comps[1], '', comps[2], comps[4], comps[6]);

    const match = Uri._REGEXP.exec(path)!;
    // if (!match) {
    // 	return new Uri(_empty, _empty, _empty, _empty, _empty);
    // }
    return new Uri(match[2], match[4], match[5], match[7], match[9]);
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

  fire(_data: any): void {
    throw new Error('Method not implemented.');
  }
  dispose(): void {
    throw new Error('Method not implemented.');
  }
}

export const workspace = {
  workspaceFolders: undefined,

  getConfiguration: function (_section?: string): vscode.WorkspaceConfiguration {
    return {
      get: function (_section: string) {
        return undefined;
      },
    } as any;
  },
};

export namespace commands {
  export const executeCommand = () => null;
}

export namespace extensions {
  export function getExtension(_extensionId: string): vscode.Extension<any> | undefined {
    return {
      packageJSON: {},
    } as any;
  }
}

export const window = {
  createOutputChannel: function (_name: string): vscode.OutputChannel {
    return {
      appendLine: function (_value: string) {
        return null;
      },
      append: () => null,
    } as any;
  },

  //export function showInputBox(options?: InputBoxOptions, token?: CancellationToken): Thenable<string | undefined>;
  showInputBox: () => null,
  showQuickPick: () => null,
  showOpenDialog: () => null,
  showSaveDialog: () => null,
  showErrorMessage: () => null,
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
