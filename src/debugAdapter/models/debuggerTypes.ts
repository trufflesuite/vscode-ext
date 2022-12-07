// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {DebugProtocol} from '@vscode/debugprotocol';
import {EVENT_TYPES} from '../constants/debugAdapter';

export namespace DebuggerTypes {
  export interface IBreakpoint {
    id: number;
    sourceId: string;
    line: number;
  }

  export interface IFrame {
    file: string;
    line: number;
    column: number;
  }

  /**
   * Represents the arguments needed to initiate a new Truffle `DebugSession` request.
   *
   * All properties in this interface are defined as optional given that the Debugger
   * can be started from a [launch configuration](https://code.visualstudio.com/docs/editor/debugging#_launch-configurations),
   * where any property might be missing.
   *
   * `package.json` also defines these properties.
   */
  export interface DebugArgs {
    /**
     * The transaction hash to debug.
     */
    txHash?: string;

    /**
     * Directory of the Truffle project where to find the Truffle config file.
     */
    workingDirectory?: string;

    /**
     * Provider's URL of the Ethereum network to connect to.
     */
    providerUrl?: string;

    /**
     * Network name of the Ethereum network to connect to.
     */
    network?: string;

    /**
     * When set, do not try to fetch external contract sources when debugging a forked network instance.
     * When the network is not being forked, this flag is ignored.
     */
    disableFetchExternal?: boolean;
  }

  // The interface should always match schema in the package.json.
  export interface ILaunchRequestArguments extends DebugProtocol.LaunchRequestArguments, DebugArgs {
    // TODO: Are these attributes being used? If not we should remove it in a future PR.
    // Automatically stop target after launch. If not specified, target does not stop.
    stopOnEntry?: boolean;
    // enable logging the Debug Adapter Protocol
    trace?: boolean;
    host?: string;
    files?: string[];
  }

  export class LaunchedEvent implements DebugProtocol.Event {
    public event: string = EVENT_TYPES.launched;
    public seq = 1000;
    public type = 'event';
  }
}
