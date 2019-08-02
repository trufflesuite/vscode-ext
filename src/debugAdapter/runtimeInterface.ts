import { EventEmitter } from 'events';
import * as os from 'os';
import * as truffleDebugUtils from 'truffle-debug-utils';
import * as truffleDebugger from 'truffle-debugger';
import {
  filterBaseContracts,
  filterContractsWithAddress,
  prepareContracts,
} from './contracts/contractsPrepareHelpers';
import { toWindowsPath } from './helpers';
import { DebuggerTypes } from './models/debuggerTypes';
import { IContractModel } from './models/IContractModel';
import { IInstruction } from './models/IInstruction';

const WIN32 = 'win32';
// this is a flag for the case when truffle-debugger lib is updated with custom stacktrace
const CUSTOM_STACK_TRACE_IS_INJECTED = false;

export default class RuntimeInterface extends EventEmitter {
  public isDebuggerAttached: boolean;
  private _session: truffleDebugger.Session | undefined;
  private _selectors: truffleDebugger.Selectors;
  private _numBreakpoints: number;
  private _osPlatform: string;
  private _contractsWithAddress: IContractModel[];
  private _baseContracts: IContractModel[];
  private _initialBreakPoints: Array<{ path: string, lines: number[] }>;

  constructor() {
    super();

    this._selectors = truffleDebugger.selectors;
    this._numBreakpoints = 0;
    this._osPlatform = os.platform();
    this.isDebuggerAttached = false;
    this._initialBreakPoints = [];
    this._contractsWithAddress = [];
    this._baseContracts = [];
  }

  public clearBreakpoints(): Promise<void> {
    return this._session
      ? this._session.removeAllBreakpoints()
      : Promise.resolve();
  }

  public storeInitialBreakPoints(path: string, lines: number[]) {
    this._initialBreakPoints.push({ path, lines });
  }

  public async processInitialBreakPoints() {
    if (this._initialBreakPoints.length === 0) {
      return;
    }

    for (const initialBreakPoint of this._initialBreakPoints) {
      const { path, lines } = initialBreakPoint;
      for (const line of lines) {
        await this.setBreakpoint(path, line);
      }
    }
    this._initialBreakPoints.length = 0; // remove them since they are no longer needed
  }

  public async setBreakpoint(path: string, line: number): Promise<DebuggerTypes.IBreakpoint | null> {
    if (!this._session) {
      return Promise.resolve(null);
    }
    let breakpoint: DebuggerTypes.IBreakpoint;

    // we'll need the debugger-internal ID of this source
    const debuggerSources: any = this._session.view(this._selectors.solidity.info.sources);
    const matchingSources: any = Object.values(debuggerSources).filter((sourceObject: any) => {
      const formattedSourPath = this._osPlatform === WIN32
        ? toWindowsPath(sourceObject.sourcePath)
        : sourceObject.sourcePath;
      return formattedSourPath.includes(path);
    });
    const sourceId = matchingSources[0].id;

    breakpoint = {
      id: this._numBreakpoints,
      line,
      sourceId,
    };

    this._numBreakpoints++;
    await this._session.addBreakpoint(breakpoint);
    return breakpoint;
  }

  // Get stack trace (without method name)
  public callStack(): any[] {
    this.validateSession();
    const result: any[] = [];
    const callStack = this._session!.view(this._selectors.evm.current.callstack);
    const currentLine = this.currentLine();
    const defaultLine = { line: 0, column: 0 };
    for (const fn of callStack) {
      // source is stored for previous call only
      if (CUSTOM_STACK_TRACE_IS_INJECTED && fn.source) {
        const { file, line, column } = fn.source;
        result.push({ file, line, column, isCurrent: false });
      } else {
        let isCurrent: boolean;
        let linesInfo: any;
        // if currentLine from baseContract then consider this is current call
        const isBaseContract = this._baseContracts.some((c) => c.sourcePath === currentLine.file);
        if (isBaseContract) {
          isCurrent = true;
          linesInfo = currentLine;
        } else {
          const contract = this._contractsWithAddress
            .find((c: any) => c.address === (fn.address || fn.storageAddress));
          if (contract === undefined) {
            throw new Error(`Coundn\'t find contract by address ${fn.address || fn.storageAddress}`);
          }
          isCurrent = contract.sourcePath === currentLine.file;
          linesInfo = isCurrent ? currentLine : { file: contract.sourcePath, ...defaultLine };
        }

        result.push({ ...linesInfo, address: fn.address, isCurrent });
      }
    }

    return result;
  }

  public async variables(/* args?: DebugProtocol.VariablesArguments */): Promise<any> {
    if (this._session) {
      const variables = await this._session.variables();
      return truffleDebugUtils.nativize(variables);
    } else {
      return Promise.resolve({});
    }
  }

  public async continue(): Promise<void> {
    this.validateSession();
    await this._session!.continueUntilBreakpoint();
    this.processSteping('stopOnBreakpoint');
  }

  public continueReverse(): void {
    this.validateSession();
    this.sendEvent('stopOnBreakpoint');
  }

  public async stepNext(): Promise<void> {
    this.validateSession();
    await this._session!.stepNext();
    this.processSteping('stopOnStepOver');
  }

  public async stepIn(): Promise<void> {
    this.validateSession();
    await this._session!.stepInto();
    this.processSteping('stopOnStepIn');
  }

  public async stepOut(): Promise<void> {
    this.validateSession();
    await this._session!.stepOut();
    this.processSteping('stopOnStepOut');
  }

  public async attach(txHash: string, workingDirectory: string): Promise<void> {
    const result: any = await prepareContracts(workingDirectory);

    this._contractsWithAddress = filterContractsWithAddress(result.contracts);
    this._baseContracts = filterBaseContracts(result.contracts);

    const debuggerOptions = {
      contracts: result.contracts,
      provider: result.provider,
    };
    const bugger = await truffleDebugger.forTx(txHash, debuggerOptions);
    this._session = bugger.connect();
    this.isDebuggerAttached = true;
  }

  public currentLine(): DebuggerTypes.IFrame {
    this.validateSession();
    const currentLocation = this._session!.view(this._selectors.controller.current.location);
    const sourcePath = this._session!.view(this._selectors.solidity.current.source).sourcePath;
    if (!sourcePath) {
      throw new Error('No source file');
    }

    return {
      column: currentLocation.sourceRange ? currentLocation.sourceRange.lines.start.column : 0,
      file: sourcePath,
      line: currentLocation.sourceRange ? currentLocation.sourceRange.lines.start.line : 0,
    };
  }

  public getInstructionSteps(): IInstruction[] {
    this.validateSession();
    const steps: IInstruction[] = this._session!.view(this._selectors.trace.steps);
    return steps;
  }

  public getCurrentInstructionStep(): IInstruction {
    this.validateSession();
    return this._session!.view(this._selectors.solidity.current.instruction) as IInstruction;
  }

  public sendEvent(event: string, ...args: any[]) {
    setImmediate(() => {
      this.emit(event, ...args);
    });
  }

  private processSteping(event: any) {
    const isEndOfTransactionTrace = this._session!.view(this._selectors.trace.finished);
    if (isEndOfTransactionTrace) {
      this.sendEvent('end');
    } else {
      this.sendEvent(event);
    }
  }

  private validateSession() {
    if (!this._session) {
      throw new Error('Debug session is undefined');
    }
  }
}
