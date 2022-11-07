import {startDebugging} from '@/commands';
import {Constants} from '@/Constants';
import {Uri, UriHandler, window} from 'vscode';

type TDebugInformation = {
  txHash: string;
  workingDirectory: string;
  providerUrl: string;
};

enum Commands {
  debug = 'debug',
}

export class UriHandlerController implements UriHandler {
  async handleUri(uri: Uri): Promise<void> {
    try {
      // Gets the command name
      const command = uri.path.replace('/', '');
      const searchParams = new URLSearchParams(uri.query);

      // Gets the configuration arguments
      const debugConfig: TDebugInformation = {
        txHash: searchParams.get('txHash')!,
        workingDirectory: searchParams.get('workingDirectory')!,
        providerUrl: searchParams.get('providerUrl')!,
      };

      // Checks what kind of command it will need to execute
      switch (command) {
        case Commands.debug:
          // Calls the debugger
          await startDebugging(debugConfig.txHash, debugConfig.workingDirectory, debugConfig.providerUrl);
          break;
      }
    } catch (error) {
      // Displays a message if the command or arguments are badly formatted
      window.showErrorMessage(Constants.errorMessageStrings.UriHandlerError);
    }
  }
}
