// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import TruffleConfig from '@truffle/config';
import truffleDebugger from '@truffle/debugger';
import {Environment} from '@truffle/environment';
import assert from 'assert';
import sinon from 'sinon';
import * as contractHelpers from '../../src/debugAdapter/contracts/contractHelpers';
import RuntimeInterface from '../../src/debugAdapter/runtimeInterface';
import {referenceConfiguration} from '../testData/truffleConfigTestdata';

describe('RuntimeInterface unit tests', () => {
  let runtimeInterface: RuntimeInterface;

  beforeEach(async () => {
    sinon.stub(contractHelpers, 'prepareContracts').resolves({mappedSources: new Map(), shimCompilations: []});
  });

  afterEach(() => {
    sinon.restore();
  });

  it('callStack should pass when session.view(evm.current.callstack) contains one call', async () => {
    // Arrange
    const sessionSelectorView = (selector: any) => {
      if (selector === truffleDebugger.selectors.evm.current.callstack) {
        return [{address: contractAddressMock}];
      }
      return {};
    };
    const sessionMock = buildSessionMock(sessionSelectorView);
    const currentDebugLine = {column: 1, file: contractSourcePathMock, line: 1};

    sinon.stub(TruffleConfig, 'detect' as any).returns(referenceConfiguration);
    sinon.stub(Environment, 'detect' as any).returns(referenceConfiguration);
    sinon.stub(RuntimeInterface.prototype, 'generateSession' as any).resolves(sessionMock);
    sinon.stub(RuntimeInterface.prototype, 'currentLine').returns({column: 1, file: contractSourcePathMock, line: 1});

    // Act
    runtimeInterface = await initMockRuntime();
    const callStack = runtimeInterface.callStack();

    // Assert
    assert.strictEqual(
      callStack[0].column,
      currentDebugLine.column,
      assertCallstackMessage('column', currentDebugLine.column)
    );
    assert.strictEqual(callStack[0].file, currentDebugLine.file, assertCallstackMessage('file', currentDebugLine.file));
    assert.strictEqual(callStack[0].line, currentDebugLine.line, assertCallstackMessage('line', currentDebugLine.line));
  });

  it('currentLine should throw error when no sourcePath', async () => {
    // Arrange
    const sessionSelectorView = (selector: any) => {
      if (selector === truffleDebugger.selectors.controller.current.location) {
        return {};
      } else if (selector === truffleDebugger.selectors.sourcemapping.current.source) {
        return undefined;
      }
      return {};
    };
    const sessionMock = buildSessionMock(sessionSelectorView);

    sinon.stub(TruffleConfig, 'detect' as any).returns(referenceConfiguration);
    sinon.stub(Environment, 'detect' as any).returns(referenceConfiguration);
    sinon.stub(RuntimeInterface.prototype, 'generateSession' as any).resolves(sessionMock);

    // Act
    runtimeInterface = await initMockRuntime();

    assert.throws(() => {
      runtimeInterface.currentLine();
    });
  });
});

const contractAddressMock = 'AddressA';
const contractSourcePathMock = 'path_to_contract';

const baseSessionMock: truffleDebugger.Session = {
  addBreakpoint: (_breakPoint: any) => ({}),
  continueUntilBreakpoint: () => Promise.resolve(),
  removeAllBreakpoints: () => Promise.resolve(),
  stepInto: () => Promise.resolve(),
  stepNext: () => Promise.resolve(),
  stepOut: () => Promise.resolve(),
  variables: () => Promise.resolve([]),
  view: (_selector: any) => ({}),
};

async function initMockRuntime() {
  const runtimeInterface = new RuntimeInterface();
  const args = {txHash: '', workingDirectory: '', disableFetchExternal: false};
  await runtimeInterface.attach(args);
  return runtimeInterface;
}

function assertCallstackMessage(callStackProp: string, callStackValue: any) {
  return `callStack elememt ${callStackProp} should be equal ${callStackValue}`;
}

function buildSessionMock(view?: (selectors: any) => any) {
  const sessionMock = {...baseSessionMock};
  if (view) {
    sessionMock.view = view;
  }

  return sessionMock;
}
