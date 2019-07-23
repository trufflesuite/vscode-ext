// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as assert from 'assert';
import * as cp from 'child_process';
import * as sinon from 'sinon';
import * as stream from 'stream';
import { OutputChannel, window } from 'vscode';
import { Constants } from '../../src/Constants';
import * as GanacheService from '../../src/GanacheService/GanacheService';
import * as GanacheServiceClient from '../../src/GanacheService/GanacheServiceClient';
import * as shell from '../../src/helpers/shell';
import { UrlValidator } from '../../src/validators/UrlValidator';

const defaultPort = '8545';
const testPortsList = ['8451', '8452', '8453'];

describe('Unit tests GanacheService', () => {

  afterEach(() => {
    sinon.restore();
  });

  ['-1', 'qwe', 'asd8545', '65536', '70000', 0].forEach((port) => {
    it(`startGanacheServer should throw an exception if port is invalid(${port})`,
      async () => {
        // Arrange
        const urlValidatorSpy = sinon.spy(UrlValidator, 'validatePort');
        // Act and Assert
        await assert.rejects(GanacheService.GanacheService.startGanacheServer(port));
        assert.strictEqual(urlValidatorSpy.called, true, 'should call url validator');
      });
  });

  ['1', '65535', '8454', 8000, 8454].forEach((port) => {
    it(`startGanacheServer should pass validation if port is ${port}`,
      async () => {
        // Arrange
        const urlValidatorSpy = sinon.spy(UrlValidator, 'validatePort');
        sinon.stub(shell, 'findPid').returns(Promise.resolve(312));
        sinon.stub(GanacheServiceClient, 'isGanacheServer').returns(Promise.resolve(true));

        // Act
        const result = await GanacheService.GanacheService.startGanacheServer(port);

        // Assert
        assert.strictEqual(urlValidatorSpy.called, true);
        assert.strictEqual(result, null);
      });
  });

  it('startGanacheServer should throw an exception if port is busy',
    async () => {
      // Arrange
      sinon.stub(shell, 'findPid').returns(Promise.resolve(312));
      sinon.stub(GanacheServiceClient, 'isGanacheServer').returns(Promise.resolve(false));

      // Act and Assert
      await assert.rejects(GanacheService.GanacheService.startGanacheServer(defaultPort));

    });

  it('startGanacheServer should execute npx cmd if port is valid and free',
    async () => {
      // Arrange
      const streamMock = {
        on(_event: 'data', _listener: (chunk: any) => void): any { /* empty */ },
      };
      const processMock = {
        on(_event: 'close', _listener: (code: number, signal: string) => void): any { /* empty */ },
        stderr: streamMock as stream.Readable,
        stdout: streamMock as stream.Readable,
      };
      const channel = {
        show() { /* empty */ },
        appendLine(_value: string): void { /* empty */ },
      };

      const urlValidatorSpy = sinon.spy(UrlValidator, 'validatePort');
      const spawnStub = sinon.stub(cp, 'spawn').returns(processMock as cp.ChildProcess);
      sinon.stub(shell, 'findPid').returns(Promise.resolve(Number.NaN));
      sinon.stub(GanacheServiceClient, 'isGanacheServer').returns(Promise.resolve(false));
      sinon.stub(GanacheServiceClient, 'waitGanacheStarted');
      sinon.stub(window, 'createOutputChannel').returns(channel as OutputChannel);

      // Act
      await GanacheService.GanacheService.startGanacheServer(defaultPort);

      // Assert
      assert.strictEqual(urlValidatorSpy.called, true);
      assert.strictEqual(spawnStub.called, true);
      assert.strictEqual(spawnStub.getCall(0).args[0], 'npx');
      assert.deepStrictEqual(spawnStub.getCall(0).args[1], ['ganache-cli', `-p ${defaultPort}`]);
    });

  it('startGanacheServer if server was not started should throw exception and dispose all',
    async () => {
      // Arrange
      const streamMock = {
        on(_event: 'data', _listener: (chunk: any) => void): any { /* empty */ },
      };
      const processMock = {
        on(_event: 'close', _listener: (code: number, signal: string) => void): any { /* empty */ },
        removeAllListeners() { /* empty */ },
        stderr: streamMock as stream.Readable,
        stdout: streamMock as stream.Readable,
      };
      const channel = {
        appendLine(_value: string): void { /* empty */ },
        dispose() { /* empty */ },
        show() { /* empty */ },
      };

      const channelDisposeSpy = sinon.spy(channel, 'dispose');
      const processRemoveAllListenersSpy = sinon.spy(processMock, 'removeAllListeners');

      sinon.spy(UrlValidator, 'validatePort');
      sinon.stub(cp, 'spawn').returns(processMock as cp.ChildProcess);
      sinon.stub(shell, 'findPid').returns(Promise.resolve(Number.NaN));
      const killPortStub = sinon.stub(shell, 'killPort');
      sinon.stub(GanacheServiceClient, 'isGanacheServer').returns(Promise.resolve(false));
      sinon.stub(GanacheServiceClient, 'waitGanacheStarted')
        .throws(new Error(Constants.ganacheCommandStrings.cannotStartServer));
      sinon.stub(window, 'createOutputChannel').returns(channel as OutputChannel);

      // Act and Assert
      await assert.rejects(
        GanacheService.GanacheService.startGanacheServer(defaultPort),
        Error,
        Constants.ganacheCommandStrings.cannotStartServer,
      );
      assert.strictEqual(killPortStub.calledOnce, true);
      assert.strictEqual(channelDisposeSpy.calledOnce, true);
      assert.strictEqual(processRemoveAllListenersSpy.calledOnce, true);
    });

  describe('Test cases with "ganacheProcesses"', () => {

    beforeEach(() => {
      GanacheService.GanacheService.ganacheProcesses[testPortsList[0]]
        = {} as GanacheService.GanacheService.IGanacheProcess;
      GanacheService.GanacheService.ganacheProcesses[testPortsList[1]]
        = {} as GanacheService.GanacheService.IGanacheProcess;
      GanacheService.GanacheService.ganacheProcesses[testPortsList[2]]
        = {} as GanacheService.GanacheService.IGanacheProcess;
    });

    afterEach(() => {
      Object.keys(GanacheService.GanacheService.ganacheProcesses).forEach((port) => {
        delete GanacheService.GanacheService.ganacheProcesses[port];
      });
    });

    it('stopGanacheServer should kill port and remove element from "ganacheProcesses" list',
      async () => {
        // Arrange
        const killPortStub = sinon.stub(shell, 'killPort');
        const targetProcess = {
          removeAllListeners() { /* empty */ },
        } as cp.ChildProcess;
        const targetOutput = {
          dispose() {/* empty */ },
        } as OutputChannel;
        const processSpy = sinon.spy(targetProcess, 'removeAllListeners');
        const outputSpy = sinon.spy(targetOutput, 'dispose');
        GanacheService.GanacheService.ganacheProcesses[defaultPort] = {
          output: targetOutput,
          process: targetProcess,
        } as GanacheService.GanacheService.IGanacheProcess;

        // Act
        await GanacheService.GanacheService.stopGanacheServer(defaultPort);

        // Assert
        assert.strictEqual(killPortStub.calledOnce, true);
        assert.strictEqual(GanacheService.GanacheService.ganacheProcesses[defaultPort], undefined);
        assert.strictEqual(processSpy.calledOnce, true, '"removeAllListeners" should be executed for target process');
        assert.strictEqual(outputSpy.calledOnce, true, '"dispose" should be executed for channel');
      });

    it('stopGanacheServer should only "kill port" if passed port not presented in "ganacheProcesses" list',
      async () => {
        // Arrange
        const killPortStub = sinon.stub(shell, 'killPort');
        const targetProcess = {
          removeAllListeners() { /* empty */ },
        } as cp.ChildProcess;
        const targetOutput = {
          dispose() {/* empty */ },
        } as OutputChannel;
        const processSpy = sinon.spy(targetProcess, 'removeAllListeners');
        const outputSpy = sinon.spy(targetOutput, 'dispose');
        const targetGanacheProcess =
          { output: targetOutput, process: targetProcess } as GanacheService.GanacheService.IGanacheProcess;

        GanacheService.GanacheService.ganacheProcesses[testPortsList[2]] = targetGanacheProcess;

        // Act
        await GanacheService.GanacheService.stopGanacheServer(defaultPort);

        // Assert
        assert.strictEqual(killPortStub.calledOnce, true);
        assert.strictEqual(GanacheService.GanacheService.ganacheProcesses[defaultPort], undefined);
        assert.strictEqual(processSpy.called, false, '"removeAllListeners" not should be executed for target process');
        assert.strictEqual(outputSpy.called, false, '"dispose" should not be executed for channel');
      });

    it('dispose should kill all ports and cleanup "ganacheProcesses" list',
      async () => {
        // Arrange
        const killPortStub = sinon.stub(shell, 'killPort');

        // Act
        await GanacheService.GanacheService.dispose();

        // Assert
        assert.strictEqual(GanacheService.GanacheService.ganacheProcesses[defaultPort], undefined);
        assert.strictEqual(killPortStub.callCount, 3);

        assert.strictEqual(killPortStub.getCall(0).args[0], testPortsList[0]);
        assert.strictEqual(killPortStub.getCall(1).args[0], testPortsList[1]);
        assert.strictEqual(killPortStub.getCall(2).args[0], testPortsList[2]);
      });
  });

  const getPortFromUrlCases = [
    { url: 'http://example.com:8454', expectation: '8454' },
    { url: 'ftp://example.com:123', expectation: '123' },
    { url: 'http://example.com', expectation: Constants.defaultLocalhostPort.toString() },
    { url: 'http:8454', expectation: '8454' },
  ];

  getPortFromUrlCases.forEach((testcase) => {
    it(`getPortFromUrl should extract port ${testcase.expectation} from url ${testcase.url}`,
      async () => {
        // Act
        const port = await GanacheService.GanacheService.getPortFromUrl(testcase.url);

        // Assert
        assert.strictEqual(port, testcase.expectation);
      });
  });
});
