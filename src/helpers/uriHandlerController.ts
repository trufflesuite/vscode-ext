import {startDebugging} from '@/commands';
import {Telemetry} from '@/TelemetryClient';
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
    // Parse the URI to get the command and the parameters.
    const command = uri.path.replace('/', '');
    const searchParams = new URLSearchParams(uri.query);

    // Checks the command and executes the corresponding action.
    switch (command) {
      case Commands.debug: {
        // Convert the URI parameters to a `DebugArgs` object.
        // The `??` operator converts `null` to `undefined`.
        const args = {
          txHash: searchParams.get('txHash') ?? undefined,
          workingDirectory: searchParams.get('workingDirectory') ?? undefined,
          providerUrl: searchParams.get('providerUrl') ?? undefined,
          network: searchParams.get('network') ?? undefined,
          disableFetchExternal: !!searchParams.get('disableFetchExternal'),
        };

        // Calls the debugger with the given parameters.
        await startDebugging(args);
        break;
      }
      default:
        void window.showWarningMessage(`Unrecognized action to handle \`${command}\``);
    }

    Telemetry.sendEvent('UriHandler.handleUri', {command});
  }
}
