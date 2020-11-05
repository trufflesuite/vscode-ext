// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as assert from 'assert';
import rewire = require('rewire');
import * as sinon from 'sinon';
import uuid = require('uuid');
import * as vscode from 'vscode';
import { RequiredApps } from '../src/Constants';
import * as helpers from '../src/helpers';
import * as commands from '../src/helpers/command';
import { TestConstants } from './TestConstants';

const nodeValidVersion: commands.ICommandResult = {
  cmdOutput: 'v11.0.0',
  cmdOutputIncludingStderr: '',
  code: 0,
};
const npmValidVersion: commands.ICommandResult = {
  cmdOutput: '7.0.0',
  cmdOutputIncludingStderr: '',
  code: 0,
};
const gitValidVersion: commands.ICommandResult = {
  cmdOutput: ' 3.0.0',
  cmdOutputIncludingStderr: '',
  code: 0,
};
const truffleValidVersion: commands.ICommandResult = {
  cmdOutput: 'truffle@5.5.0',
  cmdOutputIncludingStderr: '',
  code: 0,
};
const ganacheValidVersion: commands.ICommandResult = {
  cmdOutput: 'ganache-cli@6.5.0',
  cmdOutputIncludingStderr: '',
  code: 0,
};

describe('Required helper', () => {
  describe('Unit test', () => {
    let tryExecuteCommandMock: any;
    let getWorkspaceRootMock: any;
    let requiredRewire: any;
    let showErrorMessageMock: any;
    let executeVSCommandMock: any;
    let executeCommandMock: any;

    beforeEach(() => {
      requiredRewire = rewire('../src/helpers/required');
      tryExecuteCommandMock = sinon.stub(commands, 'tryExecuteCommand');
      getWorkspaceRootMock = sinon.stub(helpers, 'getWorkspaceRoot');
      showErrorMessageMock = sinon.stub(vscode.window, 'showErrorMessage');
      executeVSCommandMock = sinon.stub(vscode.commands, 'executeCommand');
      executeCommandMock = sinon.stub(commands, 'executeCommand');
    });

    afterEach(() => {
      sinon.restore();
    });

    describe('getNodeVersion', () => {
      it('should return empty string when tryExecuteCommand throw an error', async () => {
        // Arrange
        tryExecuteCommandMock.throws(TestConstants.testError);

        // Act
        const result = await requiredRewire.required.getNodeVersion();

        // Assert
        assert.strictEqual(result, '', 'returned result should be empty');
        assert.strictEqual(tryExecuteCommandMock.calledOnce, true, 'tryExecuteCommand should be called once');
      });

      it('should return empty string when tryExecuteCommand return not zero code', async () => {
        // Arrange
        const executionResult: commands.ICommandResult = {
          cmdOutput: 'v11.0.0',
          cmdOutputIncludingStderr: '',
          code: 1,
        };
        tryExecuteCommandMock.returns(executionResult);

        // Act
        const result = await requiredRewire.required.getNodeVersion();

        // Assert
        assert.strictEqual(result, '', 'returned result should be empty');
        assert.strictEqual(tryExecuteCommandMock.calledOnce, true, 'tryExecuteCommand should be called once');
      });

      it('should return version', async () => {
        // Arrange
        const executionResult: commands.ICommandResult = {
          cmdOutput: 'v11.0.0',
          cmdOutputIncludingStderr: '',
          code: 0,
        };
        tryExecuteCommandMock.returns(executionResult);

        // Act
        const result = await requiredRewire.required.getNodeVersion();

        // Assert
        assert.strictEqual(result, '11.0.0', 'returned result should be defined');
        assert.strictEqual(tryExecuteCommandMock.calledOnce, true, 'tryExecuteCommand should be called once');
      });
    });

    describe('getNpmVersion', () => {
      it('should return empty string when tryExecuteCommand throw an error', async () => {
        // Arrange
        tryExecuteCommandMock.throws(TestConstants.testError);

        // Act
        const result = await requiredRewire.required.getNpmVersion();

        // Assert
        assert.strictEqual(result, '', 'returned result should be empty');
        assert.strictEqual(tryExecuteCommandMock.calledOnce, true, 'tryExecuteCommand should be called once');
      });

      it('should return empty string when tryExecuteCommand return not zero code', async () => {
        // Arrange
        const executionResult: commands.ICommandResult = {
          cmdOutput: 'v11.0.0',
          cmdOutputIncludingStderr: '',
          code: 1,
        };
        tryExecuteCommandMock.returns(executionResult);

        // Act
        const result = await requiredRewire.required.getNpmVersion();

        // Assert
        assert.strictEqual(result, '', 'returned result should be empty');
        assert.strictEqual(tryExecuteCommandMock.calledOnce, true, 'tryExecuteCommand should be called once');
      });

      it('should return version', async () => {
        // Arrange
        const executionResult: commands.ICommandResult = {
          cmdOutput: 'v11.0.0',
          cmdOutputIncludingStderr: '',
          code: 0,
        };
        tryExecuteCommandMock.returns(executionResult);

        // Act
        const result = await requiredRewire.required.getNpmVersion();

        // Assert
        assert.strictEqual(result, '11.0.0', 'returned result should be defined');
        assert.strictEqual(tryExecuteCommandMock.calledOnce, true, 'tryExecuteCommand should be called once');
      });
    });

    describe('getGitVersion', () => {
      it('should return empty string when tryExecuteCommand throw an error', async () => {
        // Arrange
        tryExecuteCommandMock.throws(TestConstants.testError);

        // Act
        const result = await requiredRewire.required.getGitVersion();

        // Assert
        assert.strictEqual(result, '', 'returned result should be empty');
        assert.strictEqual(tryExecuteCommandMock.calledOnce, true, 'tryExecuteCommand should be called once');
      });

      it('should return empty string when tryExecuteCommand returns not zero code', async () => {
        // Arrange
        const executionResult: commands.ICommandResult = {
          cmdOutput: ' 11.0.0',
          cmdOutputIncludingStderr: '',
          code: 1,
        };
        tryExecuteCommandMock.returns(executionResult);

        // Act
        const result = await requiredRewire.required.getGitVersion();

        // Assert
        assert.strictEqual(result, '', 'returned result should be empty');
        assert.strictEqual(tryExecuteCommandMock.calledOnce, true, 'tryExecuteCommand should be called once');
      });

      it('should return version', async () => {
        // Arrange
        const executionResult: commands.ICommandResult = {
          cmdOutput: ' 11.0.0',
          cmdOutputIncludingStderr: '',
          code: 0,
        };
        tryExecuteCommandMock.returns(executionResult);

        // Act
        const result = await requiredRewire.required.getGitVersion();

        // Assert
        assert.strictEqual(result, '11.0.0', 'returned result should be defined');
        assert.strictEqual(tryExecuteCommandMock.calledOnce, true, 'tryExecuteCommand should be called once');
      });
    });

    describe('getTruffleVersion', () => {
      it('should return local version', async () => {
        // Arrange
        getWorkspaceRootMock.returns(uuid.v4());
        const executionResult: commands.ICommandResult = {
          cmdOutput: 'truffle@11.0.0',
          cmdOutputIncludingStderr: '',
          code: 0,
        };
        tryExecuteCommandMock.returns(executionResult);

        // Act
        const result = await requiredRewire.required.getTruffleVersion();

        // Assert
        assert.strictEqual(result, '11.0.0', 'returned result should be defined');
        assert.strictEqual(tryExecuteCommandMock.calledOnce, true, 'tryExecuteCommand should be called once');
        assert.strictEqual(getWorkspaceRootMock.calledOnce, true, 'getWorkspaceRoot should be called once');
      });

      it('should return global version', async () => {
        // Arrange
        getWorkspaceRootMock.returns(uuid.v4());
        const executionResult1: commands.ICommandResult = {
          cmdOutput: '',
          cmdOutputIncludingStderr: '',
          code: 0,
        };

        const executionResult2: commands.ICommandResult = {
          cmdOutput: 'Truffle v11.0.0',
          cmdOutputIncludingStderr: '',
          code: 0,
        };

        tryExecuteCommandMock.onCall(0).returns(executionResult1);
        tryExecuteCommandMock.onCall(1).returns(executionResult2);

        // Act
        const result = await requiredRewire.required.getTruffleVersion();

        // Assert
        assert.strictEqual(result, '11.0.0', 'returned result should be defined');
        assert.strictEqual(tryExecuteCommandMock.callCount, 2, 'tryExecuteCommand should be called twice');
        assert.strictEqual(getWorkspaceRootMock.calledOnce, true, 'getWorkspaceRoot should be called once');
      });

      it('should throw an error when tryExecuteCommand throws an error on first call', async () => {
        // Arrange
        getWorkspaceRootMock.returns(uuid.v4());

        tryExecuteCommandMock.onCall(0).throws(TestConstants.testError);

        // Act and assert
        await assert.rejects(requiredRewire.required.getTruffleVersion(), Error, TestConstants.testError);
        assert.strictEqual(tryExecuteCommandMock.calledOnce, true, 'tryExecuteCommand should be called once');
        assert.strictEqual(getWorkspaceRootMock.calledOnce, true, 'getWorkspaceRoot should be called once');
      });

      it('should return empty string when tryExecuteCommand throws an error on second call', async () => {
        // Arrange
        getWorkspaceRootMock.returns(uuid.v4());
        const executionResult1: commands.ICommandResult = {
          cmdOutput: '',
          cmdOutputIncludingStderr: '',
          code: 0,
        };

        tryExecuteCommandMock.onCall(0).returns(executionResult1);
        tryExecuteCommandMock.onCall(1).throws(TestConstants.testError);

        // Act
        const result = await requiredRewire.required.getTruffleVersion();

        // Assert
        assert.strictEqual(result, '', 'returned result should be empty');
        assert.strictEqual(tryExecuteCommandMock.callCount, 2, 'tryExecuteCommand should be called twice');
        assert.strictEqual(getWorkspaceRootMock.calledOnce, true, 'getWorkspaceRoot should be called once');
      });
    });

    describe('getGanacheVersion', () => {
      it('should return local version', async () => {
        // Arrange
        getWorkspaceRootMock.returns(uuid.v4());
        const executionResult: commands.ICommandResult = {
          cmdOutput: 'ganache-cli@11.0.0',
          cmdOutputIncludingStderr: '',
          code: 0,
        };
        tryExecuteCommandMock.returns(executionResult);

        // Act
        const result = await requiredRewire.required.getGanacheVersion();

        // Assert
        assert.strictEqual(result, '11.0.0', 'returned result should be defined');
        assert.strictEqual(tryExecuteCommandMock.calledOnce, true, 'tryExecuteCommand should be called once');
        assert.strictEqual(getWorkspaceRootMock.calledOnce, true, 'getWorkspaceRoot should be called once');
      });

      it('should return global version', async () => {
        // Arrange
        getWorkspaceRootMock.returns(uuid.v4());
        const executionResult1: commands.ICommandResult = {
          cmdOutput: '',
          cmdOutputIncludingStderr: '',
          code: 0,
        };

        const executionResult2: commands.ICommandResult = {
          cmdOutput: 'v11.0.0',
          cmdOutputIncludingStderr: '',
          code: 0,
        };

        tryExecuteCommandMock.onCall(0).returns(executionResult1);
        tryExecuteCommandMock.onCall(1).returns(executionResult2);

        // Act
        const result = await requiredRewire.required.getGanacheVersion();

        // Assert
        assert.strictEqual(result, '11.0.0', 'returned result should be defined');
        assert.strictEqual(tryExecuteCommandMock.callCount, 2, 'tryExecuteCommand should be called twice');
        assert.strictEqual(getWorkspaceRootMock.calledOnce, true, 'getWorkspaceRoot should be called once');
      });

      it('should throw an error when tryExecuteCommand throw an error on first call', async () => {
        // Arrange
        getWorkspaceRootMock.returns(uuid.v4());

        tryExecuteCommandMock.onCall(0).throws(TestConstants.testError);

        // Act and assert
        await assert.rejects(requiredRewire.required.getGanacheVersion(), Error, TestConstants.testError);
        assert.strictEqual(tryExecuteCommandMock.calledOnce, true, 'tryExecuteCommand should be called once');
        assert.strictEqual(getWorkspaceRootMock.calledOnce, true, 'getWorkspaceRoot should be called once');
      });

      it('should return empty string when tryExecuteCommand throw an error on second call', async () => {
        // Arrange
        getWorkspaceRootMock.returns(uuid.v4());
        const executionResult1: commands.ICommandResult = {
          cmdOutput: '',
          cmdOutputIncludingStderr: '',
          code: 0,
        };

        tryExecuteCommandMock.onCall(0).returns(executionResult1);
        tryExecuteCommandMock.onCall(1).throws(TestConstants.testError);

        // Act
        const result = await requiredRewire.required.getGanacheVersion();

        // Assert
        assert.strictEqual(result, '', 'returned result should be empty');
        assert.strictEqual(tryExecuteCommandMock.callCount, 2, 'tryExecuteCommand should be called twice');
        assert.strictEqual(getWorkspaceRootMock.calledOnce, true, 'getWorkspaceRoot should be called once');
      });
    });

    describe('isValid', () => {
      const isValidCases = [
        {
          maxVersion: undefined,
          minVersion: 'v6.0.0',
          result: true,
          version: 'v11.0.0',
        },
        {
          maxVersion: 'v12.0.0',
          minVersion: 'v6.0.0',
          result: true,
          version: 'v11.0.0',
        },
        {
          maxVersion: 'v12.0.0',
          minVersion: 'v6.0.0',
          result: false,
          version: 'v5.0.0',
        },
        {
          maxVersion: 'v12.0.0',
          minVersion: 'v6.0.0',
          result: false,
          version: 'v13.0.0',
        },
      ];

      isValidCases.forEach((element, index) => {
        it(`should return correct result ${index + 1}`, () => {
          // Act
          const result = requiredRewire.required.isValid(element.version, element.minVersion, element.maxVersion);

          // Assert
          assert.strictEqual(result, element.result, 'returned result should be defined');
        });
      });
    });

    describe('getAllVersions', () => {
      it('should return object with applications version', async () => {
        // Arrange
        tryExecuteCommandMock.onCall(0).returns(nodeValidVersion);
        tryExecuteCommandMock.onCall(1).returns(npmValidVersion);
        tryExecuteCommandMock.onCall(2).returns(gitValidVersion);
        tryExecuteCommandMock.onCall(3).returns(truffleValidVersion);
        tryExecuteCommandMock.onCall(4).returns(ganacheValidVersion);

        // Act
        const result = await requiredRewire.required.getAllVersions();

        // Assert
        assert.strictEqual(result.length, 5, 'returned result should have length 5');
        assert.strictEqual(tryExecuteCommandMock.callCount, 5, 'tryExecuteCommand should be called 5 times');
      });
    });

    describe('checkAppsSilent', () => {
      it('should return true when all versions are valid', async () => {
        // Arrange
        tryExecuteCommandMock.onCall(0).returns(nodeValidVersion);
        tryExecuteCommandMock.onCall(1).returns(npmValidVersion);
        tryExecuteCommandMock.onCall(2).returns(gitValidVersion);
        tryExecuteCommandMock.onCall(3).returns(truffleValidVersion);
        tryExecuteCommandMock.onCall(4).returns(ganacheValidVersion);

        // Act
        const result = await requiredRewire.required.checkAppsSilent(
          RequiredApps.node,
          RequiredApps.npm,
          RequiredApps.git,
        );

        // Assert
        assert.strictEqual(result, true, 'returned result should be true');
        assert.strictEqual(tryExecuteCommandMock.callCount, 3, 'tryExecuteCommand should be called 3 times');
      });

      it('should return false when there are invalid versions', async () => {
        // Arrange
        const executionResultGit: commands.ICommandResult = {
          cmdOutput: ' 1.0.0',
          cmdOutputIncludingStderr: '',
          code: 0,
        };

        tryExecuteCommandMock.onCall(0).returns(nodeValidVersion);
        tryExecuteCommandMock.onCall(1).returns(npmValidVersion);
        tryExecuteCommandMock.onCall(2).returns(executionResultGit);
        tryExecuteCommandMock.onCall(3).returns(truffleValidVersion);
        tryExecuteCommandMock.onCall(4).returns(ganacheValidVersion);

        // Act
        const result = await requiredRewire.required.checkAppsSilent(
          RequiredApps.node,
          RequiredApps.npm,
          RequiredApps.git,
        );

        // Assert
        assert.strictEqual(result, false, 'returned result should be false');
        assert.strictEqual(tryExecuteCommandMock.callCount, 3, 'tryExecuteCommand should be called 3 times');
      });
    });

    describe('checkApps', () => {
      it('should return true when all versions are valid', async () => {
        // Arrange
        tryExecuteCommandMock.onCall(0).returns(nodeValidVersion);
        tryExecuteCommandMock.onCall(1).returns(npmValidVersion);
        tryExecuteCommandMock.onCall(2).returns(gitValidVersion);
        tryExecuteCommandMock.onCall(3).returns(truffleValidVersion);
        tryExecuteCommandMock.onCall(4).returns(ganacheValidVersion);

        // Act
        const result = await requiredRewire.required.checkApps(
          RequiredApps.node,
          RequiredApps.npm,
          RequiredApps.git,
        );

        // Assert
        assert.strictEqual(result, true, 'returned result should be true');
        assert.strictEqual(tryExecuteCommandMock.callCount, 3, 'tryExecuteCommand should be called 3 times');
        assert.strictEqual(showErrorMessageMock.called, false, 'showErrorMessage shouldn\'t be called');
        assert.strictEqual(executeVSCommandMock.called, false, 'executeVSCommand shouldn\'t be called');
      });

      it('should return false when there are invalid versions', async () => {
        // Arrange
        const executionResultGit: commands.ICommandResult = {
          cmdOutput: ' 1.0.0',
          cmdOutputIncludingStderr: '',
          code: 0,
        };

        tryExecuteCommandMock.onCall(0).returns(nodeValidVersion);
        tryExecuteCommandMock.onCall(1).returns(npmValidVersion);
        tryExecuteCommandMock.onCall(2).returns(executionResultGit);
        tryExecuteCommandMock.onCall(3).returns(truffleValidVersion);
        tryExecuteCommandMock.onCall(4).returns(ganacheValidVersion);

        // Act
        const result = await requiredRewire.required.checkApps(
          RequiredApps.node,
          RequiredApps.npm,
          RequiredApps.git,
        );

        // Assert
        assert.strictEqual(result, false, 'returned result should be false');
        assert.strictEqual(tryExecuteCommandMock.callCount, 3, 'tryExecuteCommand should be called 3 times');
        assert.strictEqual(showErrorMessageMock.called, true, 'showErrorMessage should be called');
        assert.strictEqual(executeVSCommandMock.called, true, 'executeVSCommand should be called');
      });
    });

    describe('checkRequiredApps', () => {
      it('should return true when all versions are valid', async () => {
        // Arrange
        tryExecuteCommandMock.onCall(0).returns(nodeValidVersion);
        tryExecuteCommandMock.onCall(1).returns(npmValidVersion);
        tryExecuteCommandMock.onCall(2).returns(gitValidVersion);
        tryExecuteCommandMock.onCall(3).returns(truffleValidVersion);
        tryExecuteCommandMock.onCall(4).returns(ganacheValidVersion);

        // Act
        const result = await requiredRewire.required.checkRequiredApps();

        // Assert
        assert.strictEqual(result, true, 'returned result should be true');
        assert.strictEqual(tryExecuteCommandMock.callCount, 3, 'tryExecuteCommand should be called 3 times');
        assert.strictEqual(showErrorMessageMock.called, false, 'showErrorMessage shouldn\'t be called');
        assert.strictEqual(executeVSCommandMock.called, false, 'executeVSCommand shouldn\'t be called');
      });

      it('should return false when there are invalid versions', async () => {
        // Arrange
        const executionResultGit: commands.ICommandResult = {
          cmdOutput: ' 1.0.0',
          cmdOutputIncludingStderr: '',
          code: 0,
        };

        tryExecuteCommandMock.onCall(0).returns(nodeValidVersion);
        tryExecuteCommandMock.onCall(1).returns(npmValidVersion);
        tryExecuteCommandMock.onCall(2).returns(executionResultGit);
        tryExecuteCommandMock.onCall(3).returns(truffleValidVersion);
        tryExecuteCommandMock.onCall(4).returns(ganacheValidVersion);

        // Act
        const result = await requiredRewire.required.checkRequiredApps();

        // Assert
        assert.strictEqual(result, false, 'returned result should be false');
        assert.strictEqual(tryExecuteCommandMock.callCount, 3, 'tryExecuteCommand should be called 3 times');
        assert.strictEqual(showErrorMessageMock.called, true, 'showErrorMessageMock should be called');
        assert.strictEqual(executeVSCommandMock.called, true, 'executeVSCommand should be called');
      });
    });

    describe('installNpm', () => {
      it('should install npm', async () => {
        // Arrange
        getWorkspaceRootMock.returns(uuid.v4());
        executeCommandMock.returns(uuid.v4());
        tryExecuteCommandMock.returns(npmValidVersion);

        // Act
        await requiredRewire.required.installNpm();

        // Assert
        assert.strictEqual(getWorkspaceRootMock.called, true, 'getWorkspaceRoot should be called');
        assert.strictEqual(executeCommandMock.calledOnce, true, 'executeCommand should be called once');
        assert.strictEqual(tryExecuteCommandMock.called, true, 'tryExecuteCommand should be called');
      });

      it('should catch errors', async () => {
        // Arrange
        getWorkspaceRootMock.returns(uuid.v4());
        executeCommandMock.throws(TestConstants.testError);
        tryExecuteCommandMock.returns(npmValidVersion);

        // Act
        await requiredRewire.required.installNpm();

        // Assert
        assert.strictEqual(getWorkspaceRootMock.called, true, 'getWorkspaceRoot should be called');
        assert.strictEqual(executeCommandMock.calledOnce, true, 'executeCommand should be called once');
        assert.strictEqual(tryExecuteCommandMock.called, true, 'tryExecuteCommand should be called');
      });
    });

    describe('installTruffle', () => {
      it('should install truffle', async () => {
        // Arrange
        getWorkspaceRootMock.returns(uuid.v4());
        executeCommandMock.returns(uuid.v4());
        tryExecuteCommandMock.returns(truffleValidVersion);

        // Act
        await requiredRewire.required.installTruffle();

        // Assert
        assert.strictEqual(getWorkspaceRootMock.called, true, 'getWorkspaceRoot should be called');
        assert.strictEqual(executeCommandMock.calledOnce, true, 'executeCommand should be called once');
        assert.strictEqual(tryExecuteCommandMock.called, true, 'tryExecuteCommand should be called');
      });

      it('should catch errors', async () => {
        // Arrange
        getWorkspaceRootMock.returns(uuid.v4());
        executeCommandMock.throws(TestConstants.testError);
        tryExecuteCommandMock.returns(truffleValidVersion);

        // Act
        await requiredRewire.required.installTruffle();

        // Assert
        assert.strictEqual(getWorkspaceRootMock.called, true, 'getWorkspaceRoot should be called');
        assert.strictEqual(executeCommandMock.calledOnce, true, 'executeCommand should be called once');
        assert.strictEqual(tryExecuteCommandMock.called, true, 'tryExecuteCommand should be called');
      });
    });

    describe('installGanache', () => {
      it('should install ganache-cli', async () => {
        // Arrange
        getWorkspaceRootMock.returns(uuid.v4());
        executeCommandMock.returns(uuid.v4());
        tryExecuteCommandMock.returns(ganacheValidVersion);

        // Act
        await requiredRewire.required.installGanache();

        // Assert
        assert.strictEqual(getWorkspaceRootMock.called, true, 'getWorkspaceRoot should be called');
        assert.strictEqual(executeCommandMock.calledOnce, true, 'executeCommand should be called once');
        assert.strictEqual(tryExecuteCommandMock.called, true, 'tryExecuteCommand should be called');
      });

      it('should catch errors', async () => {
        // Arrange
        getWorkspaceRootMock.returns(uuid.v4());
        executeCommandMock.throws(TestConstants.testError);
        tryExecuteCommandMock.returns(ganacheValidVersion);

        // Act
        await requiredRewire.required.installGanache();

        // Assert
        assert.strictEqual(getWorkspaceRootMock.called, true, 'getWorkspaceRoot should be called');
        assert.strictEqual(executeCommandMock.calledOnce, true, 'executeCommand should be called once');
        assert.strictEqual(tryExecuteCommandMock.called, true, 'tryExecuteCommand should be called');
      });
    });
  });
});
