import { DebugProtocol } from 'vscode-debugprotocol';
import { EVENT_TYPES } from '../constants/debugAdapter';

export namespace DebuggerTypes {
  export interface IBreakpoint {
    id: number;
    sourceId: number;
    line: number;
  }

  export interface IFrame {
    file: string;
    line: number;
    column: number;
  }

  // The interface should always match schema in the package.json.
  export interface ILaunchRequestArguments extends DebugProtocol.LaunchRequestArguments {
    // Automatically stop target after launch. If not specified, target does not stop.
    stopOnEntry?: boolean;
    // enable logging the Debug Adapter Protocol
    trace?: boolean;
    host?: string;
    txHash: string;
    files: string[];
    workingDirectory: string;
    providerUrl: string;
  }

  export class LaunchedEvent implements DebugProtocol.Event {
    public event: string = EVENT_TYPES.launched;
    public seq: number = 1000;
    public type: string = 'event';
  }
}
