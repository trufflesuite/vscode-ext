// Copyright (c) 2022. Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {GanacheCommands} from '@/commands';
import {LocalNetworkNode, LocalProject, TLocalProjectOptions} from '@/Models/TreeItems';
import {GanacheService} from '@/services';
import {ProjectView} from '@/ViewItems';
import * as vscode from 'vscode';
import fs from 'fs-extra';
import path from 'path';
import {Constants} from '@/Constants';
import {Web3Wrapper} from '@/debugAdapter/web3Wrapper';
import {INetworkOption} from '@/helpers/ConfigurationReader';

/**
 * Object that gathers all the information of a project that comes from the Treeview of Networks.
 */
type TProjectInformation = {
  projectView: ProjectView;
  label: string;
  options: TLocalProjectOptions;
  port: number;
  networkId: string;
};

/**
 * Object that gathers all the information that comes from a Web3 Provider.
 */
type TProviderInformation = {
  currentBlock: number;
  gasPrice: string;
  gasLimit: number;
  networkId: string;
  rpcServer: string;
  txs: TTxs[];
};

/**
 * Object that gathers all the transaction information.
 */
type TTxs = {
  hash: string;
  value: string;
  fromAddress: string;
  gasUsed: string;
  createdContractAddress: string;
};

class GanacheDetails {
  /**
   * Identifies the type of the webview panel.
   */
  private readonly _viewType = 'truffle-vscode.ganache.details';

  /**
   * Number of blocks which the transactions contained will be displayed.
   */
  private readonly _blocksToRead = 5;

  /**
   * A panel that contains a webview.
   */
  private _panel?: vscode.WebviewPanel;

  /**
   * The project instance coming from the Network Treeview.
   */
  private _projectView?: ProjectView;

  constructor(private readonly _context: vscode.ExtensionContext) {}

  /**
   * This action is responsible for creating or show the WebviewPanel, set the Events and load the information.
   *
   * @param projectView - represents the project instance coming from the Network Treeview
   */
  public async createOrShowWebviewPanel(projectView: ProjectView): Promise<vscode.WebviewPanel | undefined> {
    // Sets the project view
    this._projectView = projectView;

    // Checks if the Webview Panel is already created
    if (this._panel) {
      // Reveals the existent Webview Panel instance
      this._panel.reveal(vscode.ViewColumn.One);

      // Loads all content from the provider to the front end
      this.bindWebviewPanel(this._projectView!);

      // Return undefined because it does not need to be register again
      return undefined;
    }

    // Creates the WebviewPanel and set the options
    this._panel = vscode.window.createWebviewPanel(this._viewType, 'Loading...', vscode.ViewColumn.One, {
      enableScripts: true,
      localResourceRoots: [this._context.extensionUri],
      retainContextWhenHidden: true,
    });

    // Set the event that receives calls from the front end
    this._panel.webview.onDidReceiveMessage(async (data) => {
      switch (data.command) {
        case 'refresh': {
          // Reloads the provider content again
          await this.bindWebviewPanel(this._projectView!);
          break;
        }
      }
    });

    // Sets the event that disposes the WebviewPanel
    this._panel.onDidDispose(
      () => {
        this._panel = undefined;
      },
      null,
      this._context.subscriptions
    );

    // Loads all content from the provider to the front end
    this.bindWebviewPanel(projectView);

    // Returns the Webview panel instance
    return this._panel;
  }

  /**
   * This action is responsible for loading all content from the provider to the front end
   * including block, gas transactions and others
   *
   * @param projectView - represents the project instance coming from Network Treeview
   */
  private async bindWebviewPanel(projectView: ProjectView): Promise<void> {
    // Gets the project information
    const projectInformation = await this.getProjectInformation(projectView);

    // Checks if the Ganache instance is running. If it's not running, start it
    const isGanacheRunning = await this.isGanacheRunning(projectInformation);

    // if the port is busy, send the warning
    if (!isGanacheRunning) {
      vscode.window.showInformationMessage(Constants.ganacheCommandStrings.ganachePortIsBusy);
      return;
    }

    // Gets all provider information, including block, gas, transactions and others
    const providerInformation = await this.getProviderInformation(projectInformation);

    // Pushes all the information received from the provider inside the webview
    this.setWebViewPanelInformation(projectInformation, providerInformation);
  }

  /**
   * This action is responsible for getting all project information from the Network Treeview
   *
   * @param projectView - represents the project instance coming from Network Treeview
   */
  private async getProjectInformation(projectView: ProjectView): Promise<TProjectInformation> {
    // Gets the local project and network node concerning to the Treeview Item
    const localProject = projectView.extensionItem as LocalProject;
    const networkNode = projectView.extensionItem.getChildren()[0] as LocalNetworkNode;

    // Returns the object with all project information formatted
    return {
      projectView: projectView,
      label: localProject.label,
      options: localProject.options,
      port: networkNode.port,
      networkId: networkNode.networkId as string,
    };
  }

  /**
   * This action is responsible for checking if the Ganache instance is running.
   * If the instance is not running, it starts.
   *
   * @param projectInformation - represents all formatted project information coming from a ProjectView
   */
  private async isGanacheRunning(projectInformation: TProjectInformation): Promise<boolean> {
    // Checks the port status
    const portStatus = await GanacheService.getPortStatus(projectInformation.port);
    let isRunning = false;

    // Checks the Ganache status instance and take the proper action
    switch (portStatus) {
      case GanacheService.PortStatus.FREE:
        await GanacheCommands.startGanacheCmd(
          async () => await GanacheCommands.selectGanachePortAndOptions(projectInformation.projectView)
        );
        isRunning = true;
        break;
      case GanacheService.PortStatus.GANACHE:
        isRunning = true;
        break;
      case GanacheService.PortStatus.NOT_GANACHE:
        isRunning = false;
        break;
    }

    // Returns whether the instance is running or not
    return isRunning;
  }

  /**
   * This action is responsible for getting all provider information,
   * including block, gas, transactions and others.
   *
   * @param projectInformation - represents all formatted project information coming from a ProjectView
   */
  private async getProviderInformation(projectInformation: TProjectInformation): Promise<TProviderInformation> {
    // Set the web3 provider
    const web3 = await this.setWeb3(projectInformation);

    // Gets the last block number
    const blockNumber = await web3.eth.getBlockNumber();

    // Gets the information concerning the block
    const {gasLimit} = await web3.eth.getBlock(blockNumber);

    // Returns the provider information
    return {
      currentBlock: blockNumber,
      gasLimit: gasLimit,
      networkId: projectInformation.networkId,
      rpcServer: `${Constants.networkProtocols.http}${Constants.localhost}:${projectInformation.port}`,
      gasPrice: await web3.eth.getGasPrice(),
      txs: await this.getTransactions(web3),
    };
  }

  /**
   * This action is responsible for setting the WebviewPanel information,
   * as icon, title, html and send the provider information to the front end
   *
   * @param projectInformation - represents all formatted project information coming from a ProjectView
   * @param providerInformation - represents all formatted provider information coming from a Web3 Provider
   */
  private async setWebViewPanelInformation(
    projectInformation: TProjectInformation,
    providerInformation: TProviderInformation
  ) {
    // Sets the panel icon
    const dark = vscode.Uri.file(path.join(this._context.extensionPath, 'resources/dark', 'LocalService.svg'));
    const light = vscode.Uri.file(path.join(this._context.extensionPath, 'resources/light', 'LocalService.svg'));

    this._panel!.iconPath = {
      dark: dark,
      light: light,
    };

    // Sets the panel title
    this._panel!.title = `${projectInformation.label} @ ${projectInformation.port}`;

    // Sets the html inside the panel
    this._panel!.webview.html = await this.getHtmlForWebview();

    // Sends the Web3 Provider information to the front end to be shown
    this._panel!.webview.postMessage({command: 'provider.set', data: providerInformation});
  }

  /**
   * This action is responsible for setting web3 provider and return an instanced object.
   *
   * @param projectInformation - represents all formatted project information coming from a ProjectView
   */
  private async setWeb3(projectInformation: TProjectInformation): Promise<Web3Wrapper> {
    // Creates an instance from network option
    const networkOption: INetworkOption = {
      host: Constants.localhost,
      port: projectInformation.port,
      network_id: projectInformation.networkId,
    };

    // Instances the web3 object and return it
    return new Web3Wrapper(networkOption);
  }

  /**
   * This action is responsible for getting all transactions from a we3 provider
   *
   * @param web3 - represents the instance of an web3 object
   */
  private async getTransactions(web3: Web3Wrapper): Promise<TTxs[]> {
    // Gets the last block form web3 provider
    const latestBlockNumber = await web3.eth.getBlockNumber();

    // Calculates the amount of blocks that will be shown
    const totalBlocks = this._blocksToRead > latestBlockNumber ? latestBlockNumber : this._blocksToRead;
    const startingBlockNumber = latestBlockNumber - this._blocksToRead > 0 ? latestBlockNumber - this._blocksToRead : 0;
    const blockNumbers = Array.from({length: totalBlocks}, (_, i) => i + 1 + startingBlockNumber).reverse();

    // Instances the batch request
    const batchRequest = web3.createBatchRequest();

    // Adds the getBlock action to the request
    blockNumbers.forEach((block) => {
      batchRequest.add(web3.eth.getBlock, block, true);
    });

    // Retrieves all blocks from batch execution
    const blocks: any[] = await batchRequest.execute();

    // Retrieves all accounts from the we3 provider
    const accounts: string[] = await web3.eth.getAccounts();

    // Retrieves all transactions from the we3 provider filtering by account
    // **** Account filter is required because Ganache can be launched with fork options enabled)
    const txs: TTxs[] = [];
    await Promise.all(
      blocks.map(async (block) => {
        const transactions: any = Object.values(block.transactions).filter((transaction: any) =>
          accounts.includes(transaction.from)
        );

        await Promise.all(
          Object.values(transactions).map(async (transaction: any) => {
            const receipt = await web3.eth.getTransactionReceipt(transaction.hash);

            const tx: TTxs = {
              hash: transaction.hash,
              value: transaction.value,
              fromAddress: receipt.from,
              gasUsed: receipt.gasUsed,
              createdContractAddress: receipt.contractAddress,
            };

            txs.push(tx);
          })
        );
      })
    );

    // Returns the filtered transactions
    return txs;
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
}

/**
 * This function is responsible for registering the Ganache Details panel
 *
 * @param context - An extension context is a collection of utilities private to an extension
 */
export async function registerGanacheDetails(context: vscode.ExtensionContext): Promise<void> {
  // Creates the webview instance
  const ganacheDetails = new GanacheDetails(context);

  // Registers the command responsible for creating the WebviewPanel
  context.subscriptions.push(
    vscode.commands.registerCommand('truffle-vscode.getGanacheServerInfo', async (projectView: ProjectView) => {
      // Creates or show the WebviewPanel
      const panel = await ganacheDetails.createOrShowWebviewPanel(projectView);

      // Once the Webview Panel has been created it will be added to subscriptions
      if (panel) context.subscriptions.push(panel);
    })
  );
}
