// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import assert from 'assert';
import {spawn} from 'child_process';
import {join as pathJoin} from 'path';
import sinon from 'sinon';
import {StoppedEvent} from '@vscode/debugadapter';
import {DebugProtocol} from '@vscode/debugprotocol';
import {GET_CURRENT_INSTRUCTION, GET_INSTRUCTIONS} from '../../src/debugAdapter/constants/debugSessionCommands';
import {SolidityDebugSession} from '../../src/debugAdapter/debugSession';
import {DebuggerTypes} from '../../src/debugAdapter/models/debuggerTypes';
import {IInstruction} from '../../src/debugAdapter/models/IInstruction';
import RuntimeInterface from '../../src/debugAdapter/runtimeInterface';
import {SolidityDebugSessionClient} from './SolidityDebugSessionClient';

describe('DebugSession unit tests', () => {
  afterEach(() => {
    sinon.restore();
  });

  it("shouldn't contain vscode module as a dependency", (done) => {
    // vscode module can be resolved inside of the extension without any issues
    // that's why we should spawn independent node process to check
    const debugSessionModule = pathJoin(__dirname, '../../src/debugAdapter/debugSession.js');
    const debugSessionResolvingProcess = spawn(process.execPath, [debugSessionModule]);
    debugSessionResolvingProcess.on('close', () => {
      done();
    });
    debugSessionResolvingProcess.stderr.on('data', (data: string | Buffer) => {
      const output: string = data.toString();
      const vscodeModuleNotFoundError = "Cannot find module 'vscode'";
      const isContainVscodeModuleNotFoundError = output.indexOf(vscodeModuleNotFoundError) !== -1;
      assert.strictEqual(
        isContainVscodeModuleNotFoundError,
        false,
        "debugSession shouldn't contain vscode module as a dependency"
      );
    });
  }).timeout(10000);

  it('should send DebuggerTypes.LaunchedEvent and StoppedEvent in specific order', async () => {
    // Arrange
    sinon.stub(RuntimeInterface.prototype, 'attach').resolves();
    sinon.stub(RuntimeInterface.prototype, 'processInitialBreakPoints').resolves();
    sinon.stub(SolidityDebugSession.prototype, 'sendResponse').returns();
    const launchedEvent = sinon.match.instanceOf(DebuggerTypes.LaunchedEvent);
    const stoppedEvent = sinon.match.instanceOf(StoppedEvent);

    const sendEventStub = sinon.stub(SolidityDebugSession.prototype, 'sendEvent');
    const sendLaunchedEventStub = sendEventStub.withArgs(launchedEvent).returns();
    const sendStoppedEventStub = sendEventStub.withArgs(stoppedEvent).returns();

    // Act
    const debugSessionClient = new SolidityDebugSessionClient();
    await debugSessionClient.execProtectedLaunchRequest();

    // Assert
    assert.strictEqual(
      sendLaunchedEventStub.calledWith(launchedEvent),
      true,
      'sendLaunchedEventStub should be called with argument'
    );
    assert.strictEqual(
      sendStoppedEventStub.calledWith(stoppedEvent),
      true,
      'sendStoppedEventStub should be called with argument'
    );
    assert.strictEqual(
      sendStoppedEventStub.calledAfter(sendLaunchedEventStub),
      true,
      'should send stop event after launch event'
    );
  });

  describe('should send sendErrorResponse when something goes wrong', () => {
    let sendErrorResponseStub: sinon.SinonStub<any[], any>;
    let sendResponseStub: sinon.SinonStub<[DebugProtocol.Response], void>;

    beforeEach(() => {
      sendErrorResponseStub = sinon.stub(SolidityDebugSession.prototype, 'sendErrorResponse' as any).returns(void 0);
      sendResponseStub = sinon.stub(SolidityDebugSession.prototype, 'sendResponse').throws();
    });

    afterEach(() => {
      sendResponseStub.restore();
      sendErrorResponseStub.restore();
    });

    it('launchRequest should sendErrorResponse when something goes wrong', async () => {
      // Act
      const debugSessionClient = new SolidityDebugSessionClient();
      await debugSessionClient.execProtectedLaunchRequest();
      // Assert
      assert.strictEqual(sendErrorResponseStub.called, true, 'sendErrorResponse should be called');
    });

    it('setBreakPointsRequest should sendErrorResponse when something goes wrong', async () => {
      // Arrange
      sinon.stub(RuntimeInterface.prototype, 'isDebuggerAttached').returns(true);
      // Act
      const debugSessionClient = new SolidityDebugSessionClient();
      await debugSessionClient.execProtectedSetBreakPointsRequest();
      // Assert
      assert.strictEqual(sendErrorResponseStub.called, true, 'sendErrorResponse should be called');
    });

    it('threadsRequest should sendErrorResponse when something goes wrong', async () => {
      // Act
      const debugSessionClient = new SolidityDebugSessionClient();
      await debugSessionClient.execProtectedThreadRequest();
      // Assert
      assert.strictEqual(sendErrorResponseStub.called, true, 'sendErrorResponse should be called');
    });

    it('stackTraceRequest should sendErrorResponse when something goes wrong', async () => {
      // Act
      const debugSessionClient = new SolidityDebugSessionClient();
      await debugSessionClient.execProtectedStackTraceRequest();
      // Assert
      assert.strictEqual(sendErrorResponseStub.called, true, 'sendErrorResponse should be called');
    });
  });

  it('setBreakPointsRequest should store breakPoints before debugger is attached', async () => {
    // Arrange
    const storeInitialBreakPointsStub = sinon.stub(RuntimeInterface.prototype, 'storeInitialBreakPoints').returns();
    sinon.stub(RuntimeInterface.prototype, 'isDebuggerAttached').returns(false);
    sinon.stub(SolidityDebugSession.prototype, 'sendResponse').returns();

    // Act
    const debugSessionClient = new SolidityDebugSessionClient();
    await debugSessionClient.execProtectedSetBreakPointsRequest();

    // Assert
    assert.strictEqual(storeInitialBreakPointsStub.called, true, 'storeInitialBreakPoints should be called');
  });

  describe('customRequest', () => {
    const currentInstructionMock = {pc: 0, op: 'OpA'};
    const instructionsMock = [currentInstructionMock, {pc: 1, op: 'OpB'}];
    let sendResponseStub: sinon.SinonStub<[DebugProtocol.Response], void>;
    let getAllInstructionsStub: sinon.SinonStub<[], IInstruction[]>;
    let getCurrentInstructionStub: sinon.SinonStub<[], IInstruction>;

    beforeEach(() => {
      sendResponseStub = sinon.stub(SolidityDebugSession.prototype, 'sendResponse').returns();
      getAllInstructionsStub = sinon.stub(RuntimeInterface.prototype, 'getInstructionSteps').returns(instructionsMock);
      getCurrentInstructionStub = sinon
        .stub(RuntimeInterface.prototype, 'getCurrentInstructionStep')
        .returns(currentInstructionMock);
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should return response with all instructions when command is GET_INSTRUCTIONS', async () => {
      // Arrange
      const response = sinon.match.hasNested('body.instructions', sinon.match(instructionsMock));
      // Act
      const debugSessionClient = new SolidityDebugSessionClient();
      await debugSessionClient.execProtectedCustomRequest(GET_INSTRUCTIONS);

      // Assert
      assert.strictEqual(getAllInstructionsStub.called, true, 'getInstructionSteps should be called');
      assert.strictEqual(getCurrentInstructionStub.called, false, "getCurrentInstructionStep shouldn't be called");
      assert.strictEqual(
        sendResponseStub.calledWith(response),
        true,
        'sendResponse should be called with concrete args'
      );
    });

    it('should return response with current instruction when command is GET_CURRENT_INSTRUCTION', async () => {
      // Arrange
      const response = sinon.match.hasNested('body.currentInstruction', sinon.match(currentInstructionMock));
      // Act
      const debugSessionClient = new SolidityDebugSessionClient();
      await debugSessionClient.execProtectedCustomRequest(GET_CURRENT_INSTRUCTION);

      // Assert
      assert.strictEqual(getAllInstructionsStub.called, false, "getInstructionSteps shouldn't be called");
      assert.strictEqual(getCurrentInstructionStub.called, true, 'getCurrentInstructionStep should be called');
      assert.strictEqual(
        sendResponseStub.calledWith(response),
        true,
        'sendResponse should be called with concrete args'
      );
    });
  });
});
