// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as path from 'path';
import * as vscode from 'vscode';
import { vscodeEnvironment } from './helpers';

export class UiServer {

    public static launchWebview() {
      const workspacePath = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : '';
      const htmlPath = path.join(workspacePath, 'drizzle', 'index.html');

      vscodeEnvironment.openExternal(vscode.Uri.parse(`file://${htmlPath}`));
    }

    public static async startServer(): Promise<void> {
      this.launchWebview();
   }
}
