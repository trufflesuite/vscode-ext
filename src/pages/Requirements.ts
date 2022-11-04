// Copyright (c) 2022. Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {ExtensionContext} from 'vscode';
import {Constants} from '@/Constants';
import {required} from '@/helpers/required';
import {BasicWebView, IWebViewConfig} from './BasicWebView';

export class RequirementsPage extends BasicWebView {
  protected readonly config: IWebViewConfig;

  constructor(context: ExtensionContext) {
    super(context);
    this.config = Object.assign({}, Constants.webViewPages.requirements);
  }

  protected async setShowOnStartupFlagAtFirstTime(): Promise<boolean> {
    return true;
  }

  protected async receiveMessage(message: {[key: string]: any}): Promise<void> {
    await super.receiveMessage(message);

    if (!this.panel) {
      return;
    }

    if (message.command === 'documentReady') {
      await this.postMessage({
        command: 'versions',
        value: await required.getAllVersions(),
      });
    }

    if (message.command === 'executeCommand') {
      if (message.value === 'installNpm') {
        await required.installNpm();
      }

      if (message.value === 'installTruffle') {
        await required.installTruffle();
      }

      if (message.value === 'installGanache') {
        await required.installGanache();
      }
    }
  }

  protected async getHtmlForWebview(): Promise<string> {
    let html = await super.getHtmlForWebview();
    if (html !== '') {
      // let's get the versions we expect and inject them into the page...
      const versions = await required.getAllVersions();
      versions.forEach((v) => {
        html = html.replace(new RegExp('{{' + v.app + '}}', 'g'), mapRequiredVersion(v.requiredVersion));
        html = html.replace(new RegExp('{{' + v.app + '-installed}}', 'g'), v.version);
        // change the CSS on installed version... green/pink depending on valid/invalid...
        html = html.replace(new RegExp('{{' + v.app + '-version}}', 'g'), v.isValid ? 'version' : 'versionInvalid');
      });
    }
    return html;
  }
}

const mapRequiredVersion = (requiredVersion: string | {min: string; max: string}) =>
  typeof requiredVersion === 'string' ? requiredVersion : `^${requiredVersion.min} - ⌵${requiredVersion.max}`;
