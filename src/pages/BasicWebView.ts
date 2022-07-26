// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import fs from 'fs-extra';
import {
  Disposable,
  ExtensionContext,
  Uri,
  ViewColumn,
  WebviewOptions,
  WebviewPanel,
  WebviewPanelOptions,
  window,
} from 'vscode';
import {Constants} from '../Constants';
import {showNotification} from '../helpers/userInteraction';
import {Telemetry} from '../TelemetryClient';

export interface IWebViewConfig {
  path: string;
  showOnStartup: string;
  title: string;
  viewType: string;
}

export interface IWebViewMessage {
  command: string;
  value: any;
}

export abstract class BasicWebView {
  protected panel?: WebviewPanel;
  protected readonly context: ExtensionContext;
  protected readonly disposables: Disposable[];
  protected readonly options: WebviewPanelOptions & WebviewOptions;
  protected readonly rootPath: Uri;

  protected abstract config: IWebViewConfig;

  private startShowDate: number;

  protected constructor(context: ExtensionContext) {
    this.context = context;
    this.startShowDate = 0;
    this.disposables = [];
    this.rootPath = Uri.file(this.context.asAbsolutePath('.'));
    this.options = {
      enableCommandUris: true,
      enableScripts: true,
      localResourceRoots: [this.rootPath],
      retainContextWhenHidden: true,
    };
  }

  public async checkAndShow(): Promise<void> {
    const showOnStartup = this.context.globalState.get(this.config.showOnStartup);
    if (showOnStartup === false) {
      return;
    }

    if (showOnStartup === undefined) {
      this.context.globalState.update(this.config.showOnStartup, await this.setShowOnStartupFlagAtFirstTime());
    }

    Telemetry.sendEvent(Constants.telemetryEvents.webPages.showWebPage, {
      trigger: 'auto',
      viewType: this.config.viewType,
    });
    return this.createAndShow();
  }

  public async show() {
    Telemetry.sendEvent(Constants.telemetryEvents.webPages.showWebPage, {
      trigger: 'manual',
      viewType: this.config.viewType,
    });
    return this.createAndShow();
  }

  public async postMessage(message: IWebViewMessage): Promise<void> {
    if (!this.panel || !this.panel.webview) {
      return;
    }

    await this.panel.webview.postMessage(message);
  }

  protected async createAndShow(): Promise<void> {
    if (this.panel) {
      return this.panel.reveal(ViewColumn.One);
    }

    this.panel = window.createWebviewPanel(this.config.viewType, this.config.title, ViewColumn.One, this.options);
    this.startShowDate = new Date().getTime();

    this.panel.webview.html = await this.getHtmlForWebview();

    this.panel.webview.onDidReceiveMessage((message) => this.receiveMessage(message), null, this.disposables);
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
  }

  protected abstract setShowOnStartupFlagAtFirstTime(): Promise<boolean>;

  protected async getHtmlForWebview(): Promise<string> {
    if (this.panel) {
      const rootPath = this.panel.webview.asWebviewUri(this.rootPath).toString();
      const html = await fs.readFile(this.config.path, 'utf8');

      return html.replace(/{{root}}/g, rootPath);
    }
    return '';
  }

  protected async receiveMessage(message: {[key: string]: any}): Promise<void> {
    if (!this.panel) {
      return;
    }

    switch (message.command) {
      case 'documentReady':
        await this.postMessage({
          command: 'showOnStartup',
          value: this.context.globalState.get(this.config.showOnStartup),
        });
        break;
      case 'toggleShowPage':
        this.context.globalState.update(this.config.showOnStartup, message.value);
        break;
      case 'executeCommand':
      case 'openLink':
        Telemetry.sendEvent(Constants.telemetryEvents.webPages.action, message);
        break;
      case 'notification':
        showNotification(message.value);
        break;
    }
  }

  protected dispose(): void {
    if (this.panel) {
      this.panel.dispose();

      const duration = (new Date().getTime() - this.startShowDate) / 1000;
      this.startShowDate = 0;
      Telemetry.sendEvent(
        Constants.telemetryEvents.webPages.disposeWebPage,
        {viewType: this.config.viewType},
        {duration}
      );
    }

    while (this.disposables.length) {
      const x = this.disposables.pop();
      if (x) {
        x.dispose();
      }
    }

    this.panel = undefined;
  }
}
