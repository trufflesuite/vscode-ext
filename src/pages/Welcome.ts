// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {commands, ExtensionContext} from 'vscode';
import {Constants} from '../Constants';
import {BasicWebView, IWebViewConfig} from './BasicWebView';

export class WelcomePage extends BasicWebView {
  protected readonly config: IWebViewConfig;

  constructor(context: ExtensionContext) {
    super(context);
    this.config = Object.assign({}, Constants.webViewPages.welcome);
  }

  protected async setShowOnStartupFlagAtFirstTime(): Promise<boolean> {
    return false;
  }

  protected async receiveMessage(message: {[key: string]: any}): Promise<void> {
    await super.receiveMessage(message);

    if (!this.panel) {
      return;
    }

    if (message.command === 'executeCommand') {
      if (message.value === 'createProject') {
        await commands.executeCommand('truffle-vscode.createProject');
      }

      if (message.value === 'connectProject') {
        await commands.executeCommand('truffle-vscode.connectProject');
      }
    }
  }
}
