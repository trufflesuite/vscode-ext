// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

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

export abstract class BasicWebView {
  protected panel?: WebviewPanel;
  protected readonly context: ExtensionContext;
  protected readonly disposables: Disposable[];
  protected readonly options: WebviewPanelOptions & WebviewOptions;
  protected readonly rootPath: Uri;
  protected abstract showOnStartup: string;
  protected abstract title: string;
  protected abstract viewType: string;

  protected constructor(context: ExtensionContext) {
    this.context = context;
    this.disposables = [];
    this.rootPath = Uri.file(this.context.asAbsolutePath('.'));
    this.options = {
      enableCommandUris: true,
      enableScripts: true,
      localResourceRoots: [ this.rootPath ],
      retainContextWhenHidden: true,
    };
  }

  public async checkAndShow(): Promise<void> {
    const showOnStartup = this.context.globalState.get(this.showOnStartup);
    if (showOnStartup === false) {
      return;
    }

    if (showOnStartup === undefined) {
      this.context.globalState.update(this.showOnStartup, await this.setShowOnStartupFlagAtFirstTime());
    }

    return this.show();
  }

  public async show(): Promise<void> {
    if (this.panel) {
      return this.panel.reveal(ViewColumn.One);
    }

    this.panel = window.createWebviewPanel(this.viewType, this.title, ViewColumn.One, this.options);

    this.panel.webview.html = await this.getHtmlForWebview();

    this.panel.webview.onDidReceiveMessage((message) => this.receiveMessage(message), null, this.disposables);
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
  }

  protected abstract async setShowOnStartupFlagAtFirstTime(): Promise<boolean>;

  protected abstract async getHtmlForWebview(): Promise<string>;

  protected async receiveMessage(message: {[key: string]: any}): Promise<void> {
    if (!this.panel) {
      return;
    }

    if (message.command === 'documentReady') {
      this.panel.webview.postMessage({
        command: 'showOnStartup',
        value: this.context.globalState.get(this.showOnStartup),
      });
    }

    if (message.command === 'toggleShowPage') {
      this.context.globalState.update(this.showOnStartup, message.value);
    }
  }

  private dispose(): void {
    if (this.panel) {
      this.panel.dispose();
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
