// import { generateDebugAdapterConfig, TruffleCommands } from '@/commands';
import { startDebugging } from '@/commands';
import * as vscode from 'vscode';

type TDebugInformation = {
  txHash: string;
  workingDirectory: string;
  providerUrl: string;
};

enum Commands {
  debug = 'debug',
}

/* URI HANDLER */

export default class UriHandler implements vscode.UriHandler {
  private disposables: vscode.Disposable[] = [];

  constructor() {
    this.disposables.push(vscode.window.registerUriHandler(this));
  }

  dispose() {
    this.disposables.forEach((disposable) => disposable.dispose());
    this.disposables = [];
  }

  async handleUri(uri: vscode.Uri): Promise<void> {
    const command = uri.path.replace('/', '');
    const debugConfig = JSON.parse(uri.query) as TDebugInformation;

    switch (command) {
      case Commands.debug:
        await startDebugging(debugConfig.txHash, debugConfig.workingDirectory, debugConfig.providerUrl);
        break;
    }
  }
}
