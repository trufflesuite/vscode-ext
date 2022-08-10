import * as vscode from 'vscode';
import fs from 'fs-extra';
import path from 'path';
import {Constants} from '@/Constants';
import {OutputLabel} from '@/Output';

export class LogView implements vscode.WebviewViewProvider {
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

  public addLog(label: OutputLabel, log: string, ...args: any[]): void {
    if (this._view) {
      let tool: string;

      switch (label) {
        case OutputLabel.ganacheCommands:
          tool = Constants.panels.log.tool.ganache;
          break;
        case OutputLabel.dashboardCommands:
          tool = Constants.panels.log.tool.dashboard;
          break;
        default:
          tool = Constants.panels.log.tool.truffle;
          break;
      }

      this._view.show?.(true); // `show` is not implemented in 1.49 but is for 1.50 insiders
      this._view.webview.postMessage({command: 'addLog', tool, log, ...args});
    }
  }

  public clearState(): void {
    if (this._view) {
      this._view.show?.(true); // `show` is not implemented in 1.49 but is for 1.50 insiders
      this._view.webview.postMessage({command: 'clearState'});
    }
  }

  private async _getHtmlForWebview(): Promise<string> {
    if (this._view) {
      const file = await fs.readFile(
        this._context.asAbsolutePath(path.join('resources', 'logPanel', 'index.html')),
        'utf8'
      );
      const virtualPath = this._view.webview.asWebviewUri(this._extensionUri).toString();
      return file.replace(/{{root}}/g, virtualPath);
    }

    return '';
  }
}

export function registerLogView(context: vscode.ExtensionContext): vscode.Disposable {
  const logView = new LogView(context);

  vscode.commands.registerCommand(
    `${Constants.panels.log.viewType}.addLog`,
    (label: OutputLabel, log: string, ...args: any[]) => {
      logView.addLog(label, log, ...args);
    }
  );

  return vscode.window.registerWebviewViewProvider(Constants.panels.log.viewType, logView);
}
