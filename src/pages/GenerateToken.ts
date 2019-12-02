// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ExtensionContext } from 'vscode';
import { Constants } from '../Constants';
import { BasicWebView, IWebViewConfig } from './BasicWebView';

export class GenerateToken extends BasicWebView {
  protected readonly config: IWebViewConfig;

  constructor(context: ExtensionContext) {
    super(context);
    this.config = Object.assign({}, Constants.webViewPages.generateToken);
  }

  protected async setShowOnStartupFlagAtFirstTime(): Promise<boolean> {
    return false;
  }

  protected async receiveMessage(message: {[key: string]: any}): Promise<void> {
    await super.receiveMessage(message);

    if (!this.panel) {
      return;
    }

    if (message.command === 'tokenExpression') {
      // TODO: change this to process tokenExpression
      // @ts-ignore
      const tokenExpression = message.value;
    }
  }
}
