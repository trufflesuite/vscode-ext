// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as fs from 'fs-extra';
import { ExtensionContext } from 'vscode';
import { Constants } from '../Constants';
import { BasicWebView } from './BasicWebView';

export class WelcomePage extends BasicWebView {
  protected readonly showOnStartup: string;
  protected readonly title: string;
  protected readonly viewType: string;

  constructor(context: ExtensionContext) {
    super(context);

    this.showOnStartup = Constants.showOnStartupWelcomePage;
    this.title = Constants.webViewPages.welcome;
    this.viewType = 'welcomePage';
  }

  protected async setShowOnStartupFlagAtFirstTime(): Promise<boolean> {
    return false;
  }

  protected async getHtmlForWebview(): Promise<string> {
    const rootPath = this.rootPath.with({scheme: 'vscode-resource'}).toString();
    const html = await fs.readFile(Constants.welcomePagePath, 'utf8');

    return html.replace(/{{root}}/g, rootPath);
  }
}
