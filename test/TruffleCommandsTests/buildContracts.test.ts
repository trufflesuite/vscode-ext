// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as assert from 'assert';
import * as sinon from 'sinon';
import * as uuid from 'uuid';
import { TruffleCommands } from '../../src/commands/TruffleCommands';
import * as helpers from '../../src/helpers';
import * as commands from '../../src/helpers/command';
import { TestConstants } from '../TestConstants';

describe('BuildContracts Command', () => {
  describe('Integration test', async () => {
    let requiredMock: sinon.SinonMock;
    let getWorkspaceRootMock: any;
    let checkAppsSilent: sinon.SinonExpectation;
    let installTruffle: sinon.SinonExpectation;
    let commandContextMock: sinon.SinonMock;
    let executeCommandMock: sinon.SinonExpectation;

    beforeEach(() => {
      requiredMock = sinon.mock(helpers.required);

      getWorkspaceRootMock = sinon.stub(helpers, 'getWorkspaceRoot');
      getWorkspaceRootMock.returns(uuid.v4());

      checkAppsSilent = requiredMock.expects('checkAppsSilent');
      installTruffle = requiredMock.expects('installTruffle');

      commandContextMock = sinon.mock(commands);
      executeCommandMock = commandContextMock.expects('executeCommand');
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should not throw exception when truffle already installed', async () => {
      // Arrange
      checkAppsSilent.returns(true);
      executeCommandMock.returns(uuid.v4());

      // Act
      await TruffleCommands.buildContracts();

      // Assert
      assert.strictEqual(checkAppsSilent.calledOnce, true, 'checkAppsSilent should be called once');
      assert.strictEqual(getWorkspaceRootMock.calledOnce, true, 'getWorkspaceRoot should be called once');
      assert.strictEqual(installTruffle.called, false, 'installTruffle should not be called');
      assert.strictEqual(executeCommandMock.called, true, 'executeCommand should be called');
    });

    it('should not throw exception when truffle not installed', async () => {
      // Arrange
      checkAppsSilent.returns(false);
      executeCommandMock.returns(uuid.v4());

      // Act
      await TruffleCommands.buildContracts();

      // Assert
      assert.strictEqual(checkAppsSilent.calledOnce, true, 'checkAppsSilent should be called once');
      assert.strictEqual(getWorkspaceRootMock.calledOnce, true, 'getWorkspaceRoot be should called once');
      assert.strictEqual(installTruffle.calledOnce, true, 'installTruffle should be called once');
      assert.strictEqual(executeCommandMock.called, true, 'executeCommand should be called');
    });

    it('should throw exception when truffle build failed', async () => {
      // Arrange
      checkAppsSilent.returns(true);
      executeCommandMock.throws(TestConstants.testError);

      // Act and assert
      await assert.rejects(TruffleCommands.buildContracts(), Error, TestConstants.testError);
      assert.strictEqual(checkAppsSilent.calledOnce, true, 'checkAppsSilent should be called once');
      assert.strictEqual(getWorkspaceRootMock.calledOnce, true, 'getWorkspaceRoot should be called once');
      assert.strictEqual(installTruffle.called, false, 'installTruffle should not be called');
      assert.strictEqual(executeCommandMock.called, true, 'executeCommand should be called');
    });

    it('should throw exception when truffle install failed', async () => {
      // Arrange
      checkAppsSilent.returns(false);
      executeCommandMock.returns(uuid.v4());
      installTruffle.throws(TestConstants.testError);

      // Act and assert
      await assert.rejects(TruffleCommands.buildContracts(), Error, TestConstants.testError);
      assert.strictEqual(checkAppsSilent.calledOnce, true, 'checkAppsSilent should be called once');
      assert.strictEqual(getWorkspaceRootMock.called, false, 'getWorkspaceRoot should not be called');
      assert.strictEqual(installTruffle.called, true, 'installTruffle should be called');
      assert.strictEqual(executeCommandMock.called, false, 'executeCommand should not be called');
    });
  });
});
