// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as fs from 'fs-extra';
import { ExtensionContext } from 'vscode';
import { Constants } from '../Constants';
import { required } from '../helpers';
import { BasicWebView } from './BasicWebView';

export class RequirementsPage extends BasicWebView {
  protected readonly showOnStartup: string;
  protected readonly title: string;
  protected readonly viewType: string;

  constructor(context: ExtensionContext) {
    super(context);

    this.showOnStartup = Constants.showOnStartupRequirementsPage;
    this.title = Constants.webViewPages.requirements;
    this.viewType = 'requirementsPage';
  }

  protected async setShowOnStartupFlagAtFirstTime(): Promise<boolean> {
    return true;
  }

  protected async getHtmlForWebview(): Promise<string> {
    const rootPath = this.rootPath.with({scheme: 'vscode-resource'}).toString();
    const html = await fs.readFile(Constants.requirementsPagePath, 'utf8');

    return html.replace(/{{root}}/g, rootPath);
  }

  protected async receiveMessage(message: {[key: string]: any}): Promise<void> {
    await super.receiveMessage(message);

    if (!this.panel) {
      return;
    }

    if (message.command === 'documentReady') {
      this.panel.webview.postMessage({
        command: 'versions',
        value: await required.getAllVersions(),
      });
    }

    if (message.command === 'installNpm') {
      await required.installNpm();
    }

    if (message.command === 'installTruffle') {
     await required.installTruffle(required.Scope.global);
    }

    if (message.command === 'installGanache') {
      await required.installGanache(required.Scope.global);
    }
  }
}
