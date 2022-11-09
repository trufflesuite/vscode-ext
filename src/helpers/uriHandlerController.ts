import {startDebugging} from '@/commands';
import {Constants} from '@/Constants';
import {Uri, UriHandler, window} from 'vscode';

/**
 * This type of URI handler is used to handle the `truffle-vscode` URI scheme.
 */
type TDebugInformation = {
  /**
   * The transaction hash to debug.
   */
  txHash: string;

  /**
   * The working directory of the project.
   */
  workingDirectory: string;

  /**
   * The network provider url.
   */
  providerUrl: string;

  /**
   * The fetch external contracts flag.
   */
  fetchExternal: boolean;
};

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
      const debugConfig: TDebugInformation = {
        txHash: searchParams.get('txHash')!,
        workingDirectory: searchParams.get('workingDirectory')!,
        providerUrl: searchParams.get('providerUrl')!,
        fetchExternal: Boolean(searchParams.get('fetchExternal')!),
      };

      // Checks the command and executes the corresponding action.
      switch (command) {
        case Commands.debug:
          // Calls the debugger with the given parameters.
          await startDebugging(
            debugConfig.txHash,
            debugConfig.workingDirectory,
            debugConfig.providerUrl,
            debugConfig.fetchExternal
          );
          break;
      }
    } catch (error) {
      // Display an error message if something went wrong.
      window.showErrorMessage(Constants.errorMessageStrings.UriHandlerError);
    }
  }
}
