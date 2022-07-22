// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import truffleDebugger from '@truffle/debugger';
import assert from 'assert';
import sinon from 'sinon';
import * as contractsPrepareHelpers from '../../src/debugAdapter/contracts/contractsPrepareHelpers';
import {IContractModel} from '../../src/debugAdapter/models/IContractModel';
import RuntimeInterface from '../../src/debugAdapter/runtimeInterface';

describe('RuntimeInterface unit tests', () => {
  let runtimeInterface: RuntimeInterface;

  beforeEach(async () => {
    sinon
      .stub(contractsPrepareHelpers, 'prepareContracts')
      .resolves({contracts: contractsMock, lookupMap: new Map(), resolved: [], provider: {}, files: []});
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
    sinon.stub(RuntimeInterface.prototype, 'generateSession' as any).resolves(sessionMock);
    const currentDebugLine = {column: 1, file: contractSourcePathMock, line: 1};
    sinon.stub(RuntimeInterface.prototype, 'currentLine').returns({column: 1, file: contractSourcePathMock, line: 1});

    // Act
    runtimeInterface = await initMockRuntime();
    const callStack = await runtimeInterface.callStack();

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
const contractMock: IContractModel = {
  abi: [],
  address: contractAddressMock,
  ast: {},
  binary: '',
  compiler: {},
  contractName: '',
  deployedBinary: '',
  deployedSourceMap: '',
  source: '',
  sourceMap: '',
  sourcePath: contractSourcePathMock,
};
const contractsMock = [contractMock];

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
  await runtimeInterface.attach('', '');
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
