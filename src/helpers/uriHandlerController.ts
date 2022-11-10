import {startDebugging} from '@/commands';
import {Constants} from '@/Constants';
import {Uri, UriHandler, window} from 'vscode';

/**
 * This enum is used to identify the different types of commands that can be executed.
 */
enum Commands {
  /**
   * The command to start the debugger.
   */
  debug = 'debug',
}

export class UriHandlerController implements UriHandler {
  /**
   * This function is responsible for handling the `truffle-vscode` protocol callings.
   *
   * @param uri The URI to handle.
   */
  async handleUri(uri: Uri): Promise<void> {
    try {
      // Parse the URI to get the command and the parameters.
      const command = uri.path.replace('/', '');
      const searchParams = new URLSearchParams(uri.query);

      // Convert the URI parameters to a TDebugInformation object.
      const txHash = searchParams.get('txHash')!;
      const workingDirectory = searchParams.get('workingDirectory')!;
      const providerUrl = searchParams.get('providerUrl')!;
      const disableFetchExternal = !!searchParams.get('disableFetchExternal');

      // Checks the command and executes the corresponding action.
      switch (command) {
        case Commands.debug:
          // Calls the debugger with the given parameters.
          await startDebugging(txHash, workingDirectory, providerUrl, disableFetchExternal);
          break;
      }
    } catch (error) {
      // Display an error message if something went wrong.
      window.showErrorMessage(Constants.errorMessageStrings.UriHandlerError);
    }
  }
}
