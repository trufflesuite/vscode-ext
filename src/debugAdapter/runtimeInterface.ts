// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import truffleDebugger from '@truffle/debugger';
import {EventEmitter} from 'events';
import {prepareContracts} from './contracts/contractHelpers';
import {TranslatedResult, translateTruffleVariables} from './helpers';
import {DebuggerTypes} from './models/debuggerTypes';
import {ICallInfo} from './models/ICallInfo';
import {IInstruction} from './models/IInstruction';
import {writeFileSync} from 'fs-extra';
import {fetchAndCompileForDebugger} from '@truffle/fetch-and-compile';
import {LocalNetworkNode, LocalProject} from '@/Models/TreeItems';
import {getChainId} from '@/functions/explorer';
import {TreeManager} from '@/services/tree/TreeManager';
import {ItemType} from '@/Models';
import * as os from 'os';

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
   * @param txHash The transaction hash to debug.
   * @param workingDirectory The workspace path where the truffle project is located.
   * @param providerUrl The url provider where the contracts were deployed.
   * @returns
   */
  public async attach(txHash: string, workingDirectory: string, providerUrl: string): Promise<void> {
    // Gets the contracts compilation
    const result = await prepareContracts(workingDirectory);

    // Sets the properties to use during the debugger process
    this._mappedSources = result.mappedSources;
    const networkId = this.getNetworkId(providerUrl);

    // Sets the truffle debugger options
    const options: truffleDebugger.DebuggerOptions = {
      provider: providerUrl,
      compilations: result.shimCompilations,
      lightMode: networkId !== undefined,
    };

    this._session = await this.generateSession(txHash, networkId, options);
    this.serializeExternalSources();

    this._isDebuggerAttached = true;
  }

  /**
   *
   */
  private serializeExternalSources() {
    const byId = this._session!.view(this._selectors.sourcemapping.info.sources).byId;

    if (byId === undefined) {
      return;
    }

    for (const compilation of Object.values(byId) as {compilationId: string; source: string; sourcePath: string}[]) {
      if (compilation.compilationId.startsWith('externalFor')) {
        const tmp = os.tmpdir();
        const sourcePath = tmp + '/' + compilation.sourcePath;
        writeFileSync(sourcePath, compilation.source);
        this._mappedSources.set(compilation.sourcePath, sourcePath);
      }
    }
  }

  /**
   *
   * @param providerUrl
   * @returns
   */
  private getNetworkId(providerUrl: string) {
    const services = TreeManager.getItem(ItemType.LOCAL_SERVICE);

    if (!services || !services.getChildren()) {
      return undefined;
    }

    const projects = services.getChildren() as LocalProject[];
    const project = projects.find((project) => {
      const network = project.getChildren().at(0) as LocalNetworkNode;
      return `${network.url.protocol}//${network.url.host}` === providerUrl;
    })!;
    return getChainId(project.options.forkedNetwork);
  }

  public currentLine(): DebuggerTypes.IFrame {
    this.validateSession();
    const currentLocation = this._session!.view(this._selectors.controller.current.location);
    const source = this._session!.view(this._selectors.sourcemapping.current.source);
    const sourcePath = source.sourcePath;

    if (!sourcePath) {
      throw new Error('No source file');
    }
    // so if we have a file in a location that doesn't map 1:1 to the actual file name in the compiler we map it here...
    // const file = this._mappedSources.has(sourcePath) ? this._mappedSources.get(sourcePath) : sourcePath;
    let file: string;
    if (this._mappedSources.has(sourcePath)) {
      file = this._mappedSources.get(sourcePath)!;
    } else {
      file = sourcePath;
    }

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
}
