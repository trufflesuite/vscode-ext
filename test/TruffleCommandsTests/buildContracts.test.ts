// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {TruffleCommands} from '@/commands';
import {AbstractWorkspace, WorkspaceType} from '@/helpers/AbstractWorkspace';
import * as commands from '@/helpers/command';
import {required} from '@/helpers/required';
import assert from 'assert';
import {mock, restore, SinonExpectation, SinonMock, SinonStub, stub} from 'sinon';
import uuid from 'uuid';
import {CancellationToken, Progress, ProgressOptions, window} from 'vscode';
import {TestConstants} from '../TestConstants';

describe('BuildContracts Command', () => {
  describe('Integration test', async () => {
    let requiredMock: SinonMock;
    let checkAppsSilent: SinonExpectation;
    let installTruffle: SinonExpectation;
    let commandContextMock: SinonMock;
    let executeCommandMock: SinonExpectation;
    let withProgressStub: SinonStub<[ProgressOptions, (progress: Progress<any>, token: CancellationToken) => any], any>;

    let defaultWs: AbstractWorkspace;

    beforeEach(() => {
      requiredMock = mock(required);

      checkAppsSilent = requiredMock.expects('checkAppsSilent');
      installTruffle = requiredMock.expects('installTruffle');

      commandContextMock = mock(commands);
      executeCommandMock = commandContextMock.expects('executeCommand');

      defaultWs = new AbstractWorkspace('project/truffle-config.js', WorkspaceType.TRUFFLE);

      withProgressStub = stub(window, 'withProgress');
      withProgressStub.callsFake(async (...args: any[]) => {
        return args[1]();
      });
    });

    afterEach(() => {
      restore();
    });

    it('should not throw exception when truffle already installed', async () => {
      // Arrange
      checkAppsSilent.returns(true);
      executeCommandMock.returns(uuid.v4());

      // Act
      await TruffleCommands.buildContracts(defaultWs);

      // Assert
      assert.strictEqual(checkAppsSilent.calledOnce, true, 'checkAppsSilent should be called once');
      assert.strictEqual(installTruffle.called, false, 'installTruffle should not be called');
      assert.strictEqual(executeCommandMock.called, true, 'executeCommand should be called');
    });

    it('should not throw exception when truffle not installed', async () => {
      // Arrange
      checkAppsSilent.returns(false);
      executeCommandMock.returns(uuid.v4());

      // Act
      await TruffleCommands.buildContracts(defaultWs);

      // Assert
      assert.strictEqual(checkAppsSilent.calledOnce, true, 'checkAppsSilent should be called once');
      assert.strictEqual(installTruffle.calledOnce, true, 'installTruffle should be called once');
      assert.strictEqual(executeCommandMock.called, false, 'executeCommand should be called');
    });

    it('should throw exception when truffle build failed', async () => {
      // Arrange
      checkAppsSilent.returns(true);
      executeCommandMock.throws(TestConstants.testError);

      // Act and assert
      await assert.rejects(TruffleCommands.buildContracts(defaultWs), Error, TestConstants.testError);
      assert.strictEqual(checkAppsSilent.calledOnce, true, 'checkAppsSilent should be called once');
      assert.strictEqual(installTruffle.called, false, 'installTruffle should not be called');
      assert.strictEqual(executeCommandMock.called, true, 'executeCommand should be called');
    });

    it('should throw exception when truffle install failed', async () => {
      // Arrange
      checkAppsSilent.returns(false);
      executeCommandMock.returns(uuid.v4());
      installTruffle.throws(TestConstants.testError);

      // Act and assert
      await assert.rejects(TruffleCommands.buildContracts(defaultWs), Error, TestConstants.testError);
      assert.strictEqual(checkAppsSilent.calledOnce, true, 'checkAppsSilent should be called once');
      assert.strictEqual(installTruffle.called, true, 'installTruffle should be called');
      assert.strictEqual(executeCommandMock.called, false, 'executeCommand should not be called');
    });
  });
});
