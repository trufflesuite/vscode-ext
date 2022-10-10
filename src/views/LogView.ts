import fs from 'fs-extra';
import path from 'path';
import {OutputLabel} from '@/Output';
import {
  CancellationToken,
  commands,
  ExtensionContext,
  Uri,
  WebviewView,
  WebviewViewProvider,
  WebviewViewResolveContext,
  window,
} from 'vscode';

enum Commands {
  createLog = 'createLog',
  disposeTab = 'disposeTab',
}

enum Tools {
  truffle = 'truffle',
  ganache = 'ganache',
  dashboard = 'dashboard',
}

type TLog = {
  command: Commands;
  label: OutputLabel;
  message?: string;
  description?: string;
};

export class LogView implements WebviewViewProvider {
  public static readonly viewType = 'truffle-vscode.panel.log';
  private _extensionUri: Uri;
  private _view?: WebviewView;
  private _lazyLogs: TLog[];

  constructor(private readonly _context: ExtensionContext) {
    this._extensionUri = this._context.extensionUri;
    this._lazyLogs = [];
  }

  public async resolveWebviewView(
    webviewView: WebviewView,
    _context: WebviewViewResolveContext,
    _token: CancellationToken
  ): Promise<void> {
    // Set the webview
    this._view = webviewView;

    // Set the webview configuration
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    // Set the webview events
    this._view.onDidDispose(this.onViewDisposed, this);
    this._view.onDidChangeVisibility(this.onViewVisibilityChanged, this);

    // Set the webview html
    webviewView.webview.html = await this.getHtmlForWebview();

    // Resolves the logs that were issued before the webview was loaded
    await this.resolveLazyLogs();
  }

  /**
   * This action is responsible for creating the log according to the issuing tool.
   * If the log container does not exist, it will create a new tab with the name of the tool
   *
   * @param label - represents the log type
   * @param message - represents the log text
   * @param description - represents the log description
   */
  public async createLog(label: OutputLabel, message: string, description?: string): Promise<void> {
    // Displays the log panel. Unfortunately it doesn't load immediately so we have to wait for the html to load
    // this._view?.show?.(true); // `show` is not implemented in 1.49 but is for 1.50 insiders

    // Checks if the log panel has already been loaded and is visible
    if (this._view == null || this._view?.visible === false) {
      // If it has not yet been loaded, save the log to be executed after loading the log panel
      const command = Commands.createLog;
      this._lazyLogs.push({command, label, message, description});
      return;
    }

    // Checks the name of the tool and send the command to the client to create the log
    const tool = await this.getTool(label);
    this._view.webview.postMessage({command: 'create.log', tool, message, description});
  }

  /**
   * This action is responsible for disposing the tab according to the issuing tool.
   *
   * @param label - represents the log type
   * @param description - represents the log description
   */
  public async disposeTab(label: OutputLabel, description?: string): Promise<void> {
    // Displays the log panel. Unfortunately it doesn't load immediately so we have to wait for the html to load
    // this._view?.show?.(true); // `show` is not implemented in 1.49 but is for 1.50 insiders

    // Checks if the log panel has already been loaded and is visible
    if (this._view?.visible === false) {
      // If it has not yet been loaded, save the log to be executed after loading the log panel
      const command = Commands.disposeTab;
      this._lazyLogs.push({command, label, description});
      return;
    }

    // Checks the name of the tool and send the command to the client to dispose the tab
    const tool = await this.getTool(label);
    this._view?.webview.postMessage({command: 'dispose.tab', tool, description});
  }

  /**
   * This lazy function is responsible for creating the logs or deleting the tabs, respecting the html loading time
   */
  private async resolveLazyLogs(): Promise<void> {
    // Reads all stored logs and checks the action that will be taken
    this._lazyLogs.forEach(async (log) => {
      switch (log.command) {
        case Commands.createLog:
          // Creates the log
          await this.createLog(log.label, log.message!, log.description);
          break;
        case Commands.disposeTab:
          // Disposes the tab
          await this.disposeTab(log.label, log.description);
          break;
      }
    });

    // Resets the array
    this._lazyLogs = [];
  }

  /**
   * This function is responsible for checking the type of tool that is
   * emitting the log: truffle, ganache or dashboard
   *
   * @param label - Enum with the representation of the log type
   */
  private async getTool(label: OutputLabel): Promise<string> {
    let tool: string;

    switch (label) {
      case OutputLabel.ganacheCommands:
        // Ganache
        tool = Tools.ganache;
        break;
      case OutputLabel.dashboardCommands:
        // Dashboard
        tool = Tools.dashboard;
        break;
      // Truffle
      default:
        tool = Tools.truffle;
        break;
    }

    return tool;
  }

  /**
   * This function is responsible for retrieving the html from within the file
   * and returning it to the web provider so that it can be printed.
   */
  private async getHtmlForWebview(): Promise<string> {
    // Retrieves the HTML from the file
    const file = await fs.readFile(
      this._context.asAbsolutePath(path.join('resources', 'logPanel', 'index.html')),
      'utf8'
    );

    // Creates a virtual path so that assets from within the HTML can be loaded and return the HTML
    const virtualPath = this._view?.webview.asWebviewUri(this._extensionUri).toString();
    return file.replace(/{{root}}/g, virtualPath!);
  }

  /**
   * This event is responsible for checking the visibility of the log panel
   */
  private async onViewVisibilityChanged() {
    // Check if the view is visible
    if (this._view?.visible) {
      // Sends the message to the client so that the log history can be retrieved and printed
      this._view?.webview.postMessage({command: 'get.history'});
      // After retrieving the history, resolve new logs
      await this.resolveLazyLogs();
    }
  }

  /**
   * This event is responsible for disposing the log panel
   */
  private async onViewDisposed() {
    this._view = undefined;
  }
}

/**
 * This function is responsible for registering the log view
 *
 * @param context - An extension context is a collection of utilities private to an extension
 */
export async function registerLogView(context: ExtensionContext): Promise<void> {
  const logView = new LogView(context);

  // Registers the web view provider
  context.subscriptions.push(window.registerWebviewViewProvider(LogView.viewType, logView));

  // Registers the command responsible for creating the logs
  context.subscriptions.push(
    commands.registerCommand(
      `${LogView.viewType}.create.log`,
      async (label: OutputLabel, message: string, description?: string) => {
        await logView.createLog(label, message, description);
      }
    )
  );

  // Registers the command responsible for disposing the tabs
  context.subscriptions.push(
    commands.registerCommand(`${LogView.viewType}.dispose.tab`, async (label: OutputLabel, description?: string) => {
      await logView.disposeTab(label, description);
    })
  );
}
