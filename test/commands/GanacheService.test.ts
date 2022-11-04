// Copyright (c) 2022. Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import assert from 'assert';
import cp from 'child_process';
import sinon from 'sinon';
import stream from 'stream';
import {OutputChannel, window} from 'vscode';
import {Constants} from '../../src/Constants';
import * as outputCommandHelper from '../../src/helpers';
import * as shell from '../../src/helpers/shell';
import {TLocalProjectOptions} from '../../src/Models/TreeItems';
import {GanacheService} from '../../src/services';
import * as GanacheServiceClient from '../../src/services/ganache/GanacheServiceClient';
import {UrlValidator} from '../../src/validators/UrlValidator';

const defaultPort = '8545';
const testPortsList = ['8451', '8452', '8453'];

describe('Unit tests GanacheService', () => {
  let streamMock: stream.Readable;
  let processMock: cp.ChildProcess;
  let channel: OutputChannel;

  beforeEach(() => {
    streamMock = {
      on(_event: 'data', _listener: (chunk: any) => void): any {
        /* empty */
      },
      removeAllListeners() {
        /* empty */
      },
    } as stream.Readable;
    processMock = {
      on(_event: 'exit', _listener: (code: number, signal: string) => void): any {
        /* empty */
      },
      kill() {
        /* empty */
      },
      removeAllListeners() {
        /* empty */
      },
      stderr: streamMock,
      stdout: streamMock,
    } as cp.ChildProcess;
    channel = {
      appendLine(_value: string): void {
        /* empty */
      },
      dispose() {
        /* empty */
      },
      show() {
        /* empty */
      },
    } as OutputChannel;
  });

  afterEach(() => {
    sinon.restore();
  });

  ['-1', 'qwe', 'asd8545', '65536', '70000', 0].forEach((port) => {
    it(`startGanacheServer should throw an exception if port is invalid(${port})`, async () => {
      // Arrange
      const urlValidatorSpy = sinon.spy(UrlValidator, 'validatePort');
      // Act and Assert
      await assert.rejects(GanacheService.startGanacheServer(port));
      assert.strictEqual(urlValidatorSpy.called, true, 'should call url validator');
    });
  });

  ['1', '65535', 8000, 8454].forEach((port) => {
    it(`startGanacheServer should pass validation if port is ${port}`, async () => {
      // Arrange
      const urlValidatorSpy = sinon.spy(UrlValidator, 'validatePort');
      sinon.stub(shell, 'findPid').returns(Promise.resolve(312));
      sinon.stub(GanacheServiceClient, 'isGanacheServer').returns(Promise.resolve(true));

      // Act
      const result = await GanacheService.startGanacheServer(port);

      // Assert
      assert.strictEqual(urlValidatorSpy.called, true);
      assert.deepStrictEqual(result, {pid: 312, port});
    });
  });

  it('startGanacheServer should throw an exception if port is busy', async () => {
    // Arrange
    sinon.stub(shell, 'findPid').returns(Promise.resolve(312));
    sinon.stub(GanacheServiceClient, 'isGanacheServer').returns(Promise.resolve(false));

    // Act and Assert
    await assert.rejects(GanacheService.startGanacheServer(defaultPort));
  });

  it('startGanacheServer should execute npx cmd if port is valid and free', async () => {
    // Arrange
    const urlValidatorSpy = sinon.spy(UrlValidator, 'validatePort');
    const spawnStub = sinon.stub(outputCommandHelper, 'spawnProcess').returns(processMock as cp.ChildProcess);
    sinon.stub(shell, 'findPid').returns(Promise.resolve(Number.NaN));
    sinon.stub(window, 'createOutputChannel').returns(channel as OutputChannel);
    sinon.stub(GanacheServiceClient, 'waitGanacheStarted');

    // Act
    await GanacheService.startGanacheServer(defaultPort);

    // Assert
    assert.strictEqual(urlValidatorSpy.called, true);
    assert.strictEqual(spawnStub.called, true);
    assert.strictEqual(spawnStub.getCall(0).args[1], 'npx');
    assert.deepStrictEqual(spawnStub.getCall(0).args[2], ['ganache', `--port ${defaultPort}`]);
  });

  it('startGanacheServer should execute npx cmd with options', async () => {
    // Arrange
    const urlValidatorSpy = sinon.spy(UrlValidator, 'validatePort');
    const spawnStub = sinon.stub(outputCommandHelper, 'spawnProcess').returns(processMock as cp.ChildProcess);
    const options: TLocalProjectOptions = {
      isForked: true,
      forkedNetwork: 'goerli',
      blockNumber: 1000,
      url: '',
    };

    sinon.stub(shell, 'findPid').returns(Promise.resolve(Number.NaN));
    sinon.stub(window, 'createOutputChannel').returns(channel as OutputChannel);
    sinon.stub(GanacheServiceClient, 'waitGanacheStarted');

    // Act
    await GanacheService.startGanacheServer(defaultPort, options);

    // Assert
    assert.strictEqual(urlValidatorSpy.called, true);
    assert.strictEqual(spawnStub.called, true);
    assert.strictEqual(spawnStub.getCall(0).args[1], 'npx');
    assert.deepStrictEqual(spawnStub.getCall(0).args[2], [
      'ganache',
      `--port ${defaultPort}`,
      `--fork.network ${options.forkedNetwork}`,
      `--fork.blockNumber ${options.blockNumber}`,
    ]);
  });

  it('startGanacheServer if server was not started should throw exception and dispose all', async () => {
    // Arrange
    const killProcessStub = sinon.stub(processMock, 'kill');
    const processRemoveAllListenersSpy = sinon.spy(processMock, 'removeAllListeners');

    sinon.spy(UrlValidator, 'validatePort');
    sinon.stub(shell, 'findPid').returns(Promise.resolve(Number.NaN));
    sinon.stub(outputCommandHelper, 'spawnProcess').returns(processMock as cp.ChildProcess);
    sinon
      .stub(GanacheServiceClient, 'waitGanacheStarted')
      .throws(new Error(Constants.ganacheCommandStrings.cannotStartServer));

    // Act and Assert
    await assert.rejects(
      GanacheService.startGanacheServer(defaultPort),
      Error,
      Constants.ganacheCommandStrings.cannotStartServer
    );
    assert.strictEqual(killProcessStub.calledOnce, true);
    assert.strictEqual(processRemoveAllListenersSpy.calledOnce, true);
  });

  describe('Test cases with "ganacheProcesses"', () => {
    beforeEach(() => {
      GanacheService.ganacheProcesses[testPortsList[0]] = {
        output: channel,
        port: testPortsList[0],
        process: processMock,
      } as GanacheService.IGanacheProcess;
      GanacheService.ganacheProcesses[testPortsList[1]] = {
        output: channel,
        port: testPortsList[1],
        process: processMock,
      } as GanacheService.IGanacheProcess;
      GanacheService.ganacheProcesses[testPortsList[2]] = {
        pid: 321,
        port: testPortsList[2],
      } as GanacheService.IGanacheProcess;
    });

    afterEach(() => {
      Object.keys(GanacheService.ganacheProcesses).forEach((port) => {
        delete GanacheService.ganacheProcesses[port];
      });
    });

    it('stopGanacheServer should kill process and remove element from "ganacheProcesses" list', async () => {
      // Arrange
      const killPidStub = sinon.stub(shell, 'killPid');
      const killProcessStub = sinon.stub(processMock, 'kill');
      const processSpy = sinon.spy(processMock, 'removeAllListeners');

      GanacheService.ganacheProcesses[defaultPort] = {
        port: defaultPort,
        process: processMock,
      } as GanacheService.IGanacheProcess;

      // Act
      await GanacheService.stopGanacheServer(defaultPort);

      // Assert
      assert.strictEqual(GanacheService.ganacheProcesses[defaultPort], undefined);
      assert.strictEqual(killPidStub.called, false, '"killPid" shouldn\'t be executed for target process');
      assert.strictEqual(killProcessStub.calledOnce, true, '"kill" should be executed for target process');
      assert.strictEqual(processSpy.calledOnce, true, '"removeAllListeners" should be executed for target process');
    });

    it('stopGanacheServer should kill out of band process and remove element from ganacheProcesses list', async () => {
      // Arrange
      const killPidStub = sinon.stub(shell, 'killPid');
      const killProcessStub = sinon.stub(processMock, 'kill');
      const processSpy = sinon.spy(processMock, 'removeAllListeners');

      GanacheService.ganacheProcesses[defaultPort] = {
        pid: 321,
        port: defaultPort,
      } as GanacheService.IGanacheProcess;

      // Act
      await GanacheService.stopGanacheServer(defaultPort);

      // Assert
      assert.strictEqual(GanacheService.ganacheProcesses[defaultPort], undefined);
      assert.strictEqual(killPidStub.called, true, '"killPid" should be executed for target process');
      assert.strictEqual(killProcessStub.calledOnce, false, '"kill" shouldn\'t be executed for target process');
      assert.strictEqual(processSpy.calledOnce, false, '"removeAllListeners" shouldn\'t be executed for process');
    });

    it('stopGanacheServer should not do anything if passed port not presented in "ganacheProcesses" list', async () => {
      // Arrange
      const killPidStub = sinon.stub(shell, 'killPid');
      const killProcessStub = sinon.stub(processMock, 'kill');
      const processSpy = sinon.spy(processMock, 'removeAllListeners');
      const channelDisposeSpy = sinon.spy(channel, 'dispose');

      // Act
      await GanacheService.stopGanacheServer(defaultPort);

      // Assert
      assert.strictEqual(GanacheService.ganacheProcesses[defaultPort], undefined);
      assert.strictEqual(killPidStub.called, false, '"killPid" should be executed for target process');
      assert.strictEqual(killProcessStub.called, false, '"kill" should be executed for target process');
      assert.strictEqual(processSpy.called, false, '"removeAllListeners" not should be executed for target process');
      assert.strictEqual(channelDisposeSpy.called, false, '"dispose" should not be executed for channel');
    });

    it('dispose should kill all process and cleanup "ganacheProcesses" list', async () => {
      // Arrange
      const killPidStub = sinon.stub(shell, 'killPid');
      const killProcessStub = sinon.stub(processMock, 'kill');

      // Act
      await GanacheService.dispose();

      // Assert
      assert.strictEqual(GanacheService.ganacheProcesses[defaultPort], undefined);
      assert.strictEqual(GanacheService.ganacheProcesses[testPortsList[0]], undefined);
      assert.strictEqual(GanacheService.ganacheProcesses[testPortsList[1]], undefined);
      assert.strictEqual(GanacheService.ganacheProcesses[testPortsList[2]], undefined);
      assert.strictEqual(killProcessStub.callCount, 2, '"kill" should be executed for two target process');
      assert.strictEqual(killPidStub.callCount, 0, '"killPid" shouldn\'t be executed');
    });
  });

  const getPortFromUrlCases = [
    {url: 'http://example.com:8454', expectation: '8454'},
    {url: 'ftp://example.com:123', expectation: '123'},
    {url: 'http://example.com', expectation: Constants.defaultLocalhostPort.toString()},
    {url: 'http:8454', expectation: '8454'},
  ];

  getPortFromUrlCases.forEach((testcase) => {
    it(`getPortFromUrl should extract port ${testcase.expectation} from url ${testcase.url}`, async () => {
      // Act
      const port = await GanacheService.getPortFromUrl(testcase.url);

      // Assert
      assert.strictEqual(port, testcase.expectation);
    });
  });
});
