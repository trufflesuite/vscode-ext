import {startDebugging} from '@/commands';
import {Constants} from '@/Constants';
import {DebuggerTypes} from '@/debugAdapter/models/debuggerTypes';
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
      const launchRequest: DebuggerTypes.ILaunchRequestArguments = {
        txHash: searchParams.get('txHash')!,
        workingDirectory: searchParams.get('workingDirectory')!,
        providerUrl: searchParams.get('providerUrl')!,
        fetchExternal: searchParams.get('fetchExternal')! === 'true',
      };

      // Checks the command and executes the corresponding action.
      switch (command) {
        case Commands.debug:
          // Calls the debugger with the given parameters.
          await startDebugging(
            launchRequest.txHash,
            launchRequest.workingDirectory,
            launchRequest.providerUrl,
            launchRequest.fetchExternal!
          );
          break;
      }
    } catch (error) {
      // Display an error message if something went wrong.
      window.showErrorMessage(Constants.errorMessageStrings.UriHandlerError);
    }
  }
}
