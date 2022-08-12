import * as vscode from 'vscode';
import fs from 'fs-extra';
import path from 'path';
import {Constants} from '@/Constants';
import {OutputLabel} from '@/Output';

type TLog = {
  label: OutputLabel;
  log: string;
  description?: string;
};

export class LogView implements vscode.WebviewViewProvider {
  private _extensionUri: vscode.Uri;
  private _view?: vscode.WebviewView;
  private _logs: TLog[];

  constructor(private readonly _context: vscode.ExtensionContext) {
    this._extensionUri = this._context.extensionUri;
    this._logs = [];
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

    this._view.onDidDispose(this.onViewDisposed, this);
    this._view.onDidChangeVisibility(this.onViewVisibilityChanged, this);

    webviewView.webview.html = await this.getHtmlForWebview();

    this._logs.forEach((log) => {
      this.addLog(log.label, log.log, log.description);
    });
  }

  public addLog(label: OutputLabel, log: string, description?: string): void {
    if (this._view == null) {
      this._logs.push({label, log, description});
      return;
    }

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

    this._view.show?.(true);
    this._view.webview.postMessage({command: 'addLog', tool, log, description});
  }

  public disposeTab(label: OutputLabel, description?: string): void {
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

    this._view?.webview.postMessage({command: 'disposeTab', tool, description});
  }

  private async getHtmlForWebview(): Promise<string> {
    const file = await fs.readFile(
      this._context.asAbsolutePath(path.join('resources', 'logPanel', 'index.html')),
      'utf8'
    );
    const virtualPath = this._view?.webview.asWebviewUri(this._extensionUri).toString();
    return file.replace(/{{root}}/g, virtualPath!);
  }

  private async onViewVisibilityChanged() {
    const visible = this._view?.visible ?? false;

    if (visible) this._view?.webview.postMessage({command: 'getHistory'});
  }

  private onViewDisposed() {
    this._view = undefined;
  }
}

export function registerLogView(context: vscode.ExtensionContext): vscode.Disposable {
  const logView = new LogView(context);

  vscode.commands.registerCommand(
    `${Constants.panels.log.viewType}.addLog`,
    (label: OutputLabel, log: string, description?: string) => {
      logView.addLog(label, log, description);
    }
  );

  vscode.commands.registerCommand(
    `${Constants.panels.log.viewType}.disposeTab`,
    (label: OutputLabel, description?: string) => {
      logView.disposeTab(label, description);
    }
  );

  return vscode.window.registerWebviewViewProvider(Constants.panels.log.viewType, logView);
}
