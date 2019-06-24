// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import assert = require('assert');
import * as cp from 'child_process';
import events = require('events');
import * as os from 'os';
import rewire = require('rewire');
import * as sinon from 'sinon';
import stream = require('stream');
import * as outputCommandHelper from '../src/helpers/command';

describe('Commands helper', () => {
  const command = 'test_command';

  afterEach(() => {
    sinon.restore();
    sinon.resetHistory();
  });

  const cases = [
    { workingDirectory: 'defined', tmpdirExecuted: false },
    { workingDirectory: undefined, tmpdirExecuted: true },
  ];

  cases.forEach((testCase) => {
    it(`startProcess should return new ChildProcess when directory ${testCase.workingDirectory}`,
      async () => {
        // Arrange
        const tmpdirStub = sinon.stub(os, 'tmpdir').returns('');
        const spawnStub = sinon.stub(cp, 'spawn');

        // Act
        await outputCommandHelper.startProcess(testCase.workingDirectory, command, ['']);

        // Assert
        assert.strictEqual(tmpdirStub.calledOnce, testCase.tmpdirExecuted);
        assert.strictEqual(spawnStub.calledOnce, true);
        assert.strictEqual(spawnStub.getCall(0).args[0], command);
      });
  });

  describe('tryExecuteCommand', () => {

    let childProcessMock: sinon.SinonMock;
    let processMock: cp.ChildProcess;

    beforeEach(() => {
      processMock = new events.EventEmitter() as cp.ChildProcess;
      processMock.stdout = new events.EventEmitter() as stream.Readable;
      processMock.stderr = new events.EventEmitter() as stream.Readable;
      processMock.stdin = new stream.Writable();
      childProcessMock = sinon.mock(cp);
    });

    afterEach(() => {
      sinon.restore();
    });

    it('tryExecuteCommand should return correct result',
      async () => {
        // Arrange
        const spawnMock = childProcessMock.expects('spawn').returns(processMock);

        // Act
        const commandResultPromise = outputCommandHelper.tryExecuteCommand('workingDirectory', command, '');

        await new Promise<void>(async (resolve) => {
          setTimeout(async () => {
            await processMock.stdout.emit('data', 'test stdout');
            await processMock.emit('close', 0);
            resolve();
          }, 500);
        });

        const commandResult = await commandResultPromise;

        // Assert
        assert.strictEqual(commandResult.cmdOutput, 'test stdout');
        assert.strictEqual(spawnMock.calledOnce, true);
      });

    it('tryExecuteCommand should return correct result when there is message in error output',
      async () => {
        // Arrange
        const spawnMock = childProcessMock.expects('spawn').returns(processMock);

        // Act
        const commandResultProms = outputCommandHelper.tryExecuteCommand('workingDirectory', command, '');

        await new Promise<void>(async (resolve) => {
          setTimeout(async () => {
            await processMock.stderr.emit('data', 'test stdout');
            await processMock.emit('close', 0);
            resolve();
          }, 500);
        });

        const commandResult = await commandResultProms;

        // Assert
        assert.strictEqual(spawnMock.calledOnce, true);
        assert.strictEqual(commandResult.cmdOutputIncludingStderr, 'test stdout');
      });

    it('tryExecuteCommand should rejected on error',
      async () => {
        // Arrange
        sinon.replace(cp, 'spawn', () => { throw new Error(); });

        // Act
        const commandResultProms = outputCommandHelper.tryExecuteCommand('workingDirectory', command, '');
        await new Promise<void>(async (resolve) => {
          setTimeout(async () => {
            await processMock.stderr.emit('data', 'test stdout');
            await processMock.emit('close', 0);
            resolve();
          }, 500);
        });

        // Assert
        await assert.rejects(commandResultProms);
      });
  });

  it('executeCommand should throw error when result code not equal to 0',
    async () => {
      // Arrange
      const commandResult = {
        cmdOutput: '',
        cmdOutputIncludingStderr: '',
        code: 1,
      };
      const commandRewire = rewire('../src/helpers/command');
      commandRewire.__set__('tryExecuteCommand', sinon.mock().returns(commandResult));

      // Act and Assert
      await assert.rejects(commandRewire.executeCommand('workingDirectory', command, ''));
    });

  it('executeCommand should return command output',
    async () => {
      // Arrange
      const commandResult = {
        cmdOutput: 'stdout message',
        cmdOutputIncludingStderr: 'stderr message',
        code: 0,
      };
      const commandRewire = rewire('../src/helpers/command');
      commandRewire.__set__('tryExecuteCommand', sinon.mock().returns(commandResult));

      // Act
      const res = await commandRewire.executeCommand('workingDirectory', command, '');

      // Assert
      assert.strictEqual(res, commandResult.cmdOutput);
    });

  it('executeCommand throw error when tryExecuteCommand rejected',
    async () => {
      // Arrange
      sinon.replace(cp, 'spawn', () => { throw new Error(); });

      // Act and Assert
      await assert.rejects(outputCommandHelper.executeCommand('workingDirectory', command, ''))
        .then(() => {
          return undefined;
        });
    });
});
