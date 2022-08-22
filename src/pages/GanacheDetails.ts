import {GanacheCommands} from '@/commands';
import {LocalNetworkNode, LocalProject} from '@/Models/TreeItems';
import {GanacheService} from '@/services';
import {ProjectView} from '@/ViewItems';
import * as vscode from 'vscode';
import fs from 'fs-extra';
import path from 'path';
import {Constants} from '@/Constants';
import {Web3Wrapper} from '@/debugAdapter/web3Wrapper';
import {INetworkOption} from '@/helpers/ConfigurationReader';

class GanacheDetails {
  private readonly viewType = 'truffle-vscode.ganache.details';
  private _panel?: vscode.WebviewPanel;

  constructor(private readonly _context: vscode.ExtensionContext) {}

  public async createWebviewPanel(): Promise<vscode.WebviewPanel> {
    this._panel = vscode.window.createWebviewPanel(
      this.viewType, // Identifies the type of the webview. Used internally
      'loading...', // Title of the panel displayed to the user
      vscode.ViewColumn.One, // Editor column to show the new webview panel in.
      {
        enableScripts: true,
        localResourceRoots: [this._context.extensionUri],
      } // Webview options. More on these later.
    );

    this._panel.onDidChangeViewState(this.onDidChangeViewState, this);
    this._panel.onDidDispose(this.onViewDisposed, this);

    return this._panel;
  }

  public async getDetails(projectView: ProjectView): Promise<void> {
    const localProject = projectView.extensionItem as LocalProject;
    const networkNode = localProject.getChildren() as LocalNetworkNode[];

    const port = networkNode[0].port;
    const networkId = networkNode[0].networkId as string;
    const isGanacheRunning = await this.isGanacheRunning(projectView, port);

    if (!isGanacheRunning) {
      vscode.window.showInformationMessage(Constants.ganacheCommandStrings.ganachePortIsBusy);
      await this.onViewDisposed();
      return;
    }

    await this.setPanelInformation(localProject.label, port);
    this._panel!.webview.html = await this.getHtmlForWebview();

    const web3 = await this.setWeb3(Constants.localhost, port, networkId);
    await this.getAccounts(web3);
  }

  private async isGanacheRunning(projectView: ProjectView, port: number): Promise<boolean> {
    const portStatus = await GanacheService.getPortStatus(port);
    let isRunning = false;

    switch (portStatus) {
      case GanacheService.PortStatus.FREE:
        await GanacheCommands.startGanacheCmd(
          async () => await GanacheCommands.selectGanachePortAndOptions(projectView)
        );
        isRunning = true;
        break;
      case GanacheService.PortStatus.NOT_GANACHE:
        isRunning = false;
        break;
      case GanacheService.PortStatus.GANACHE:
        isRunning = true;
        break;
    }

    return isRunning;
  }

  private async setPanelInformation(label: string, port: number): Promise<void> {
    this._panel!.title = `${label} @ ${port}`;

    const dark = vscode.Uri.file(path.join(this._context.extensionPath, 'resources/dark', 'LocalService.svg'));

    const light = vscode.Uri.file(path.join(this._context.extensionPath, 'resources/light', 'LocalService.svg'));

    this._panel!.iconPath = {
      dark: dark,
      light: light,
    };
  }

  private async setWeb3(host: string, port: number, networkId: string): Promise<Web3Wrapper> {
    const networkOption: INetworkOption = {
      host: host,
      port: port,
      network_id: networkId,
    };

    return new Web3Wrapper(networkOption);
  }

  private async getAccounts(web3: Web3Wrapper): Promise<void> {
    const batchRequest = web3.createBatchRequest();
    const accounts: string[] = await web3.eth.getAccounts();

    accounts.forEach((account) => {
      batchRequest.add(web3.eth.getBalance, account);
    });

    const balance: any[] = await batchRequest.execute();
    console.log(balance);
  }
  /**
   * This function is responsible for retrieving the html from within the file
   * and returning it to the web provider so that it can be printed.
   */
  private async getHtmlForWebview(): Promise<string> {
    // Retrieves the HTML from the file
    const file = await fs.readFile(
      this._context.asAbsolutePath(path.join('resources', 'ganache', 'index.html')),
      'utf8'
    );

    // Creates a virtual path so that assets from within the HTML can be loaded and return the HTML
    const virtualPath = this._panel?.webview.asWebviewUri(this._context.extensionUri).toString();
    return file.replace(/{{root}}/g, virtualPath!);
  }

  private async onDidChangeViewState(e: vscode.WebviewPanelOnDidChangeViewStateEvent): Promise<void> {
    console.log(e);
  }

  private async onViewDisposed(): Promise<void> {
    this._panel?.dispose();
    this._panel = undefined;
  }
}

export async function registerGanacheDetails(context: vscode.ExtensionContext): Promise<void> {
  // Creates the webview instance
  const ganacheDetails = new GanacheDetails(context);

  // Registers the command responsible for disposing the tabs
  context.subscriptions.push(
    vscode.commands.registerCommand('truffle-vscode.getGanacheServerInfo', async (projectView: ProjectView) => {
      context.subscriptions.push(await ganacheDetails.createWebviewPanel());
      ganacheDetails.getDetails(projectView);
      // console.log(projectView);
    })
  );
}
