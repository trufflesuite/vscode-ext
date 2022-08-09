import * as vscode from 'vscode';
import fs from 'fs-extra';
import path from 'path';

export class LogView implements vscode.WebviewViewProvider {
  public static readonly viewType = 'truffle.log.panel';

  private _extensionUri: vscode.Uri;
  private _view?: vscode.WebviewView;

  constructor(private readonly _context: vscode.ExtensionContext) {
    this._extensionUri = this._context.extensionUri;
  }

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): Promise<void> {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = await this._getHtmlForWebview();

    this.clearState();
  }

  public addLog(log: string): void {
    if (this._view) {
      const imagePath = this._view.webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'images')).toString();

      this._view.show?.(true); // `show` is not implemented in 1.49 but is for 1.50 insiders
      this._view.webview.postMessage({type: 'addLog', log: log, uri: imagePath});
    }
  }

  public clearState(): void {
    if (this._view) {
      this._view.show?.(true); // `show` is not implemented in 1.49 but is for 1.50 insiders
      this._view.webview.postMessage({type: 'clearState'});
    }
  }

  private async _getHtmlForWebview(): Promise<string> {
    if (this._view) {
      const file = await fs.readFile(
        this._context.asAbsolutePath(path.join('resources', 'logPanel', 'index.html')),
        'utf8'
      );
      const virtualPath = this._view.webview
        .asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'logPanel'))
        .toString();
      return file.replace(/{{root}}/g, virtualPath);
    }

    return '';
  }
}

export function registerLogView(context: vscode.ExtensionContext): vscode.Disposable {
  const logView = new LogView(context);

  vscode.commands.registerCommand('calicoColors.addColor', (log: string) => {
    logView.addLog(log);
  });

  return vscode.window.registerWebviewViewProvider(LogView.viewType, logView);
}
