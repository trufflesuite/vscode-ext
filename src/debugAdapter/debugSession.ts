import { basename } from 'path';
import {
  Breakpoint, BreakpointEvent, InitializedEvent, logger, Logger, LoggingDebugSession,
  Source, StackFrame, StoppedEvent, TerminatedEvent, Thread,
} from 'vscode-debugadapter';
import { DebugProtocol } from 'vscode-debugprotocol';
import {
  ERROR_MESSAGE_ID,
  EVALUATE_REQUEST_TYPES,
  EVENT_REASONS,
  EVENT_TYPES,
  MAIN_THREAD,
} from './constants/debugAdapter';
import {
  GET_CURRENT_INSTRUCTION,
  GET_INSTRUCTIONS,
} from './constants/debugSessionCommands';
import { DebuggerTypes } from './models/debuggerTypes';
import RuntimeInterface from './runtimeInterface';
import VariablesHandler from './variablesHandler';

export class SolidityDebugSession extends LoggingDebugSession {
  private _runtime: RuntimeInterface;
  private _variablesHandler: VariablesHandler;

  public constructor() {
    super('debugAdapter.txt');
    // this debugger uses zero-based lines and columns
    this.setDebuggerLinesStartAt1(false);
    this.setDebuggerColumnsStartAt1(false);

    this._runtime = new RuntimeInterface();
    this._variablesHandler = new VariablesHandler(this._runtime);

    this._runtime.on(EVENT_TYPES.stopOnEntry, () => {
      this.sendEvent(new StoppedEvent(EVENT_REASONS.entry, MAIN_THREAD.id));
    });
    this._runtime.on(EVENT_TYPES.stopOnStepOver, () => {
      this.sendEvent(new StoppedEvent(EVENT_REASONS.stepOver, MAIN_THREAD.id));
    });
    this._runtime.on(EVENT_TYPES.stopOnStepIn, () => {
      this.sendEvent(new StoppedEvent(EVENT_REASONS.stepIn, MAIN_THREAD.id));
    });
    this._runtime.on(EVENT_TYPES.stopOnStepOut, () => {
      this.sendEvent(new StoppedEvent(EVENT_REASONS.stepOut, MAIN_THREAD.id));
    });
    this._runtime.on(EVENT_TYPES.stopOnBreakpoint, () => {
      this.sendEvent(new StoppedEvent(EVENT_REASONS.breakpoint, MAIN_THREAD.id));
    });
    this._runtime.on(EVENT_TYPES.stopOnException, () => {
      this.sendEvent(new StoppedEvent(EVENT_REASONS.exception, MAIN_THREAD.id));
    });
    this._runtime.on(EVENT_TYPES.breakpointValidated, (bp: DebuggerTypes.IBreakpoint) => {
      this.sendEvent(
        new BreakpointEvent(EVENT_REASONS.changed, { verified: true, id: bp.id } as DebugProtocol.Breakpoint));
    });
    this._runtime.on(EVENT_TYPES.end, () => {
      this.sendEvent(new TerminatedEvent());
    });
  }

  /**
   * The 'initialize' request is the first request called by the frontend
   * to interrogate the features the debug adapter provides.
   */
  protected initializeRequest(response: DebugProtocol.InitializeResponse,
        /* args: DebugProtocol.InitializeRequestArguments */): void {
    // build and return the capabilities of this debug adapter:
    response.body = response.body || {};

    // TODO: enable it if needed. (if the adapter implements the configurationDoneRequest.)
    response.body.supportsConfigurationDoneRequest = false;
    response.body.supportsEvaluateForHovers = true;

    // TODO: think about implementation of stepback
    // protected stepBackRequest(response: DebugProtocol.StepBackResponse, args: DebugProtocol.StepBackArguments)
    response.body.supportsStepBack = false;

    response.body.supportsSetVariable = false;
    response.body.supportsSetExpression = false;

    this.sendResponse(response);

    // since this debug adapter can accept configuration requests like 'setBreakpoint' at any time,
    // we request them early by sending an 'initializeRequest' to the frontend.
    // The frontend will end the configuration sequence by calling 'configurationDone' request.
    this.sendEvent(new InitializedEvent());
  }

  protected async launchRequest(response: DebugProtocol.LaunchResponse,
                                args: DebuggerTypes.ILaunchRequestArguments): Promise<void> {
    await this.sendErrorIfFailed(response, async () => {
      // make sure to 'Stop' the buffered logging if 'trace' is not set
      // logger.setup enable logs in client
      logger.setup(args.trace ? Logger.LogLevel.Verbose : Logger.LogLevel.Stop, false);

      // start the program in the runtime
      await this._runtime.attach(args.txHash, args.workingDirectory);
      await this._runtime.processInitialBreakPoints();

      // Events order is important
      this.sendEvent(new DebuggerTypes.LaunchedEvent());
      this.sendEvent(new StoppedEvent(EVENT_REASONS.breakpoint, MAIN_THREAD.id));
    });
  }

  protected async disconnectRequest(response: DebugProtocol.DisconnectResponse,
        /* args: DebugProtocol.DisconnectArguments */) {
    this.sendResponse(response);
  }

  protected async setBreakPointsRequest(response: DebugProtocol.SetBreakpointsResponse,
                                        args: DebugProtocol.SetBreakpointsArguments): Promise<void> {
    await this.sendErrorIfFailed(response, async () => {
      const path = args.source.path as string;
      const clientLines = args.lines || [];
      // set and verify breakpoint locations
      const actualBreakpoints: DebugProtocol.Breakpoint[] = [];
      await this._runtime.clearBreakpoints();

      for (const clientLine of clientLines) {
        const debuggerBreakpoint =
          await this._runtime.setBreakpoint(path, this.convertClientLineToDebugger(clientLine));
        if (debuggerBreakpoint) {
          const bp = new Breakpoint(true,
            this.convertDebuggerLineToClient(debuggerBreakpoint.line)) as DebugProtocol.Breakpoint;
          bp.id = debuggerBreakpoint.id;
          actualBreakpoints.push(bp);
        }
      }

      // setBreakPointsRequest is hit before runtime debugger is attached
      if (!this._runtime.isDebuggerAttached()) {
        const debuggerLines = clientLines.map((l: number) => this.convertClientLineToDebugger(l));
        this._runtime.storeInitialBreakPoints(path, debuggerLines);
      }

      // send back the actual breakpoint positions
      response.body = {
        breakpoints: actualBreakpoints,
      };
      this.sendResponse(response);
    });
  }

  protected async threadsRequest(response: DebugProtocol.ThreadsResponse): Promise<void> {
    // return a default thread
    await this.sendErrorIfFailed(response, async () => {
      response.body = {
        threads: [new Thread(MAIN_THREAD.id, MAIN_THREAD.name)],
      };
      this.sendResponse(response);
    });
  }

  protected async stackTraceRequest(response: DebugProtocol.StackTraceResponse,
        /* args: DebugProtocol.StackTraceArguments */): Promise<void> {
    await this.sendErrorIfFailed(response, async () => {
      const callStack = this._runtime.callStack();
      if (callStack !== null) {
        const stackFrames = callStack.reverse().map((c) => {
          return new StackFrame(0, c.method, this.createSource(c.file),
            this.convertDebuggerLineToClient(c.line), c.column);
        });
        response.body = {
          stackFrames,
          totalFrames: 1,
        };
      } else {
        response.body = {
          stackFrames: [],
          totalFrames: 0,
        };
      }

      this.sendResponse(response);
    });
  }

  protected scopesRequest(response: DebugProtocol.ScopesResponse,
        /* args: DebugProtocol.ScopesArguments */): void {
    response.body = {
      scopes: this._variablesHandler.getScopes(),
    };
    this.sendResponse(response);
  }

  protected async variablesRequest(response: DebugProtocol.VariablesResponse,
                                   args: DebugProtocol.VariablesArguments): Promise<void> {
    const variables =
      await this._variablesHandler.getVariableAttributesByVariableRef(args.variablesReference);

    response.body = {
      variables,
    };

    this.sendResponse(response);
  }

  protected async continueRequest(response: DebugProtocol.ContinueResponse,
        /* args: DebugProtocol.ContinueArguments */): Promise<void> {
    await this.sendErrorIfFailed(response, async () => {
      await this._runtime.continue();
      this.sendResponse(response);
    });
  }

  protected reverseContinueRequest(response: DebugProtocol.ReverseContinueResponse,
        /* args: DebugProtocol.ReverseContinueArguments */): void {
    this._runtime.continueReverse();
    this.sendResponse(response);
  }

  protected async nextRequest(response: DebugProtocol.NextResponse,
        /* args: DebugProtocol.NextArguments */): Promise<void> {
    await this.sendErrorIfFailed(response, async () => {
      await this._runtime.stepNext();
      this.sendResponse(response);
    });
  }

  protected async stepInRequest(response: DebugProtocol.StepInResponse,
        /* args: DebugProtocol.StepInArguments */): Promise<void> {
    await this.sendErrorIfFailed(response, async () => {
      await this._runtime.stepIn();
      this.sendResponse(response);
    });
  }

  protected async stepOutRequest(response: DebugProtocol.StepOutResponse,
        /* args: DebugProtocol.StepOutArguments */): Promise<void> {
    await this.sendErrorIfFailed(response, async () => {
      await this._runtime.stepOut();
      this.sendResponse(response);
    });
  }

  protected async evaluateRequest(response: DebugProtocol.EvaluateResponse,
                                  args: DebugProtocol.EvaluateArguments): Promise<void> {
    await this.sendErrorIfFailed(response, async () => {
      if (args.context === EVALUATE_REQUEST_TYPES.watch
        || args.context === EVALUATE_REQUEST_TYPES.hover
        || args.context === undefined) {
        const { result, variablesReference } =
          await this._variablesHandler.evaluateExpression(args.expression);
        response.body = { result, variablesReference };
        this.sendResponse(response);
      } else {
        response.body = { result: '', variablesReference: -1 };
        this.sendResponse(response);
      }
    });
  }

  // is invoked via debugAdaterTrackerFactory
  protected async customRequest(command: string, response: DebugProtocol.Response/*, args: any*/): Promise<void> {
    await this.sendErrorIfFailed(response, async () => {
      switch (command) {
        case GET_INSTRUCTIONS:
          response.body = {
            instructions: this._runtime.getInstructionSteps(),
          };
          break;
        case GET_CURRENT_INSTRUCTION:
          response.body = {
            currentInstruction: this._runtime.getCurrentInstructionStep(),
          };
          break;
      }

      this.sendResponse(response);
    });
  }

  private createSource(filePath: string): Source {
    return new Source(basename(filePath),
      this.convertDebuggerPathToClient(filePath), undefined, undefined, null);
  }

  private async sendErrorIfFailed(response: DebugProtocol.Response, fn: () => {}) {
    try {
      await fn();
    } catch (e) {
      this.sendErrorResponse(
        response,
        { id: ERROR_MESSAGE_ID, format: e && e.message ? e.message : e },
        '',
        null,
        undefined);
    }
  }
}
