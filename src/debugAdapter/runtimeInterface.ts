// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import truffleDebugger from '@truffle/debugger';
import {EventEmitter} from 'events';
import {prepareContracts} from './contracts/contractHelpers';
import {TranslatedResult, translateTruffleVariables} from './helpers';
import {DebuggerTypes} from './models/debuggerTypes';
import {ICallInfo} from './models/ICallInfo';
import {IInstruction} from './models/IInstruction';
import {mkdirpSync, writeFileSync} from 'fs-extra';
import {fetchAndCompileForDebugger} from '@truffle/fetch-and-compile';
import Config from '@truffle/config';
import {Environment} from '@truffle/environment';
import * as os from 'os';
import * as path from 'path';

export default class RuntimeInterface extends EventEmitter {
  private _isDebuggerAttached: boolean;
  private _session: truffleDebugger.Session | undefined;
  private _selectors: truffleDebugger.Selectors;
  private _numBreakpoints: number;
  private _initialBreakPoints: Array<{path: string; lines: number[]}>;
  /**
   * A list of mapped files so debug can open.
   */
  private _mappedSources: Map<string, string>;

  constructor() {
    super();

    this._selectors = truffleDebugger.selectors;
    this._numBreakpoints = 0;
    this._isDebuggerAttached = false;
    this._initialBreakPoints = [];
    this._mappedSources = new Map();
  }

  public clearBreakpoints(): Promise<void> {
    return this._session ? this._session.removeAllBreakpoints() : Promise.resolve();
  }

  public storeInitialBreakPoints(path: string, lines: number[]) {
    this._initialBreakPoints.push({path, lines});
  }

  public async processInitialBreakPoints() {
    if (this._initialBreakPoints.length === 0) {
      return;
    }

    for (const initialBreakPoint of this._initialBreakPoints) {
      const {path, lines} = initialBreakPoint;
      for (const line of lines) {
        await this.setBreakpoint(path, line);
      }
    }
    this._initialBreakPoints.length = 0; // remove them since they are no longer needed
  }

  public async setBreakpoint(_filePath: string, line: number): Promise<DebuggerTypes.IBreakpoint | null> {
    if (!this._session) {
      return Promise.resolve(null);
    }

    // we'll need the debugger-internal ID of this source
    const debuggerSource: any = this._session.view(this._selectors.sourcemapping.current.source);

    const breakpoint: DebuggerTypes.IBreakpoint = {
      id: this._numBreakpoints,
      line,
      sourceId: debuggerSource.id,
    };

    this._numBreakpoints++;
    // TODO: we might need to make this addBreakpoint lazy on session init.
    this._session.addBreakpoint(breakpoint);
    return breakpoint;
  }

  // Get stack trace (without method name)
  public callStack(): ICallInfo[] {
    this.validateSession();
    const currentLine = this.currentLine();
    return [{...currentLine, method: 'Current'}];
  }

  /**
   *
   * @returns the object of all the variables. keyed on variable name.
   */
  public async variables(/* args?: DebugProtocol.VariablesArguments */): Promise<
    Record<string, TranslatedResult> | any
  > {
    if (this._session) {
      const variables = await this._session.variables({indicateUnknown: true});
      return translateTruffleVariables(variables);
    } else {
      return Promise.resolve({});
    }
  }

  public async continue(): Promise<void> {
    this.validateSession();
    await this._session!.continueUntilBreakpoint();
    this.processStepping('stopOnBreakpoint');
  }

  public continueReverse(): void {
    this.validateSession();
    this.sendEvent('stopOnBreakpoint');
  }

  public async stepNext(): Promise<void> {
    this.validateSession();
    await this._session!.stepNext();
    this.processStepping('stopOnStepOver');
  }

  public async stepIn(): Promise<void> {
    this.validateSession();
    await this._session!.stepInto();
    this.processStepping('stopOnStepIn');
  }

  public async stepOut(): Promise<void> {
    this.validateSession();
    await this._session!.stepOut();
    this.processStepping('stopOnStepOut');
  }

  /**
   * This function attaches the debugger and starts the debugging process.
   *
   * @param args The `DebugArgs` to initialize the `DebugSession` this `RuntimeInterface` belong to.
   * @returns
   */
  public async attach(args: Required<DebuggerTypes.DebugArgs>): Promise<void> {
    // Retreives the truffle configuration file
    const config = Config.detect({workingDirectory: args.workingDirectory});

    // Validate the network parameter
    RuntimeInterface.validateNetwork(config, args);

    // Retreives the environment configuration
    await Environment.detect(config);

    // Gets the contracts compilation
    const result = await prepareContracts(config);

    // Sets the properties to use during the debugger process
    this._mappedSources = result.mappedSources;
    const networkId = args.disableFetchExternal ? undefined : config.network_id;

    // Sets the truffle debugger options
    const options: truffleDebugger.DebuggerOptions = {
      provider: config.provider,
      compilations: result.shimCompilations,
      lightMode: networkId !== undefined,
    };

    this._session = await this.generateSession(args.txHash, networkId, options);
    this.serializeExternalSources();

    this._isDebuggerAttached = true;
  }

  /**
   * Serialize any (fetched) external sources into a temporary folder
   * to be later opened by VS Code editor.
   *
   * Whenever this `Session` has been already initialized with fetch external sources,
   * _i.e._, `fetchAndCompileForDebugger`,
   * the corresponding sources are stored in this `Session`'s state.
   * This method serialize these Session's sources into a temporary folder
   * (as returned by `os.tmpdir()`).
   *
   * > Moreover, if the source path of a contract being serialized is a nested path,
   * > _.e.g._, `/@openzeppelin/contracts/access/Ownable.sol`,
   * this method creates the full folder path.
   */
  private serializeExternalSources() {
    const byId = this._session!.view(this._selectors.sourcemapping.info.sources).byId;

    // TODO: This guard is used so far in tests, not sure if `byId` can be undefined when running the extension.
    if (byId === undefined) {
      return;
    }

    for (const compilation of Object.values(byId) as {compilationId: string; source: string; sourcePath: string}[]) {
      if (compilation.compilationId.startsWith('externalFor')) {
        const tmp = os.tmpdir();
        const sourcePath = path.join(tmp, compilation.sourcePath);

        const sourceDir = path.dirname(sourcePath);
        mkdirpSync(sourceDir);

        writeFileSync(sourcePath, compilation.source);
        this._mappedSources.set(compilation.sourcePath, sourcePath);
      }
    }
  }

  public currentLine(): DebuggerTypes.IFrame {
    this.validateSession();
    const currentLocation = this._session!.view(this._selectors.controller.current.location);
    const sourcePath = this._session!.view(this._selectors.sourcemapping.current.source).sourcePath;
    if (!sourcePath) {
      throw new Error('No source file');
    }
    // so if we have a file in a location that doesn't map 1:1 to the actual file name in the compiler we map it here...
    const file = this._mappedSources.has(sourcePath) ? this._mappedSources.get(sourcePath) : sourcePath;

    return {
      column: currentLocation.sourceRange ? currentLocation.sourceRange.lines.start.column : 0,
      file,
      line: currentLocation.sourceRange ? currentLocation.sourceRange.lines.start.line : 0,
    };
  }

  public getInstructionSteps(): IInstruction[] {
    this.validateSession();
    return this._session!.view(this._selectors.trace.steps);
  }

  public getCurrentInstructionStep(): IInstruction {
    this.validateSession();
    return this._session!.view(this._selectors.sourcemapping.current.instruction) as IInstruction;
  }

  public sendEvent(event: string, ...args: any[]) {
    setImmediate(() => {
      this.emit(event, ...args);
    });
  }

  public isDebuggerAttached() {
    return this._isDebuggerAttached;
  }

  private processStepping(event: any) {
    const isEndOfTransactionTrace = this._session!.view(this._selectors.trace.finished);
    if (isEndOfTransactionTrace) {
      this.sendEvent('end');
    } else {
      this.sendEvent(event);
    }
  }

  /**
   * Generates the Truffle Debugger `Session`.
   *
   * `networkId` indicates which network this `Session`'s provider is forking from, if any.
   * When `networkId` is defined,
   * the Truffle `fetch-and-compile` module is used to fetch external sources,
   * currently from Etherscan.
   *
   * @param txHash
   * @param networkId
   * @param options
   * @returns
   */
  private async generateSession(
    txHash: string,
    networkId: string | number | undefined,
    options: truffleDebugger.DebuggerOptions
  ) {
    const bugger = await truffleDebugger.forTx(txHash, options);

    if (networkId) {
      await fetchAndCompileForDebugger(bugger, {network: {networkId: networkId as any}}); //Note: mutates bugger!!
      await (bugger as any).startFullMode();
    }

    return bugger.connect();
  }

  private validateSession() {
    if (!this._session) {
      throw new Error('Debug session is undefined');
    }
  }

  /**
   * Validate if the network parameter was set. Case the network is empty,
   * a temp network is created to generate a provider url
   *
   * @param config Represents the truffle configuration file.
   * @param args Represents the arguments needed to initiate a new Truffle `DebugSession` request.
   * @returns
   */
  private static validateNetwork(config: Config, args: Required<DebuggerTypes.DebugArgs>): void {
    if (args.providerUrl) {
      // Adds a temporary network to get the provider url
      config.network = 'temp_network';
      config.networks.temp_network = {
        url: args.providerUrl,
        network_id: '*',
      };
      return;
    }

    // Check if the network exists inside the Truffle configuration file
    if (!config.networks.hasOwnProperty(args.network)) {
      throw new Error(`Network '${args.network}' does not exist in your Truffle configuration file.`);
    }

    // Sets the network to get the provider url
    config.network = args.network;
  }
}
