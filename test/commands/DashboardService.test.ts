// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import assert from 'assert';
import cp from 'child_process';
import sinon from 'sinon';
import {Constants, RequiredApps} from '../../src/Constants';
import stream from 'stream';
import {OutputChannel, window} from 'vscode';
import * as outputCommandHelper from '../../src/helpers';
import * as shell from '../../src/helpers/shell';
import {DashboardService} from '@/services/dashboard/DashboardService';
import * as DashboardServiceClient from '../../src/services/dashboard/DashboardServiceClient';
import {UrlValidator} from '../../src/validators/UrlValidator';

const defaultPort = Constants.dashboardPort;

describe('Unit tests DashboardService', () => {
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
    it(`startDashboardServer should throw an exception if port is invalid(${port})`, async () => {
      // Arrange
      const urlValidatorSpy = sinon.spy(UrlValidator, 'validatePort');
      // Act and Assert
      await assert.rejects(DashboardService.startDashboardServer(port));
      assert.strictEqual(urlValidatorSpy.called, true, 'should call url validator');
    });
  });

  ['1', '65535', 8000, 8454].forEach((port) => {
    it(`startDashboardServer should pass validation if port is ${port}`, async () => {
      // Arrange
      const urlValidatorSpy = sinon.spy(UrlValidator, 'validatePort');
      sinon.stub(shell, 'findPid').returns(Promise.resolve(312));
      sinon.stub(DashboardServiceClient, 'isDashboardRunning').returns(Promise.resolve(true));

      // Act
      const result = await DashboardService.startDashboardServer(port);

      // Assert
      assert.strictEqual(urlValidatorSpy.called, true);
      assert.deepStrictEqual(result, {pid: 312, port});
    });
  });

  it('startDashboardServer should throw an exception if port is busy', async () => {
    // Arrange
    sinon.stub(shell, 'findPid').returns(Promise.resolve(312));
    sinon.stub(DashboardServiceClient, 'isDashboardRunning').returns(Promise.resolve(false));

    // Act and Assert
    await assert.rejects(DashboardService.startDashboardServer(defaultPort));
  });

  it('startDashboardServer should execute cmd if port is valid and free', async () => {
    // Arrange
    const urlValidatorSpy = sinon.spy(UrlValidator, 'validatePort');
    const spawnStub = sinon.stub(outputCommandHelper, 'spawnProcess').returns(processMock as cp.ChildProcess);
    sinon.stub(shell, 'findPid').returns(Promise.resolve(Number.NaN));
    sinon.stub(window, 'createOutputChannel').returns(channel as OutputChannel);
    sinon.stub(DashboardServiceClient, 'waitDashboardStarted');

    // Act
    await DashboardService.startDashboardServer(defaultPort);

    // Assert
    assert.strictEqual(urlValidatorSpy.called, true);
    assert.strictEqual(spawnStub.called, true);
    assert.strictEqual(spawnStub.getCall(0).args[1], `${RequiredApps.truffle} ${RequiredApps.dashboard}`);
  });

  it('startDashboardServer if server was not started should throw exception and dispose all', async () => {
    // Arrange
    const killProcessStub = sinon.stub(processMock, 'kill');
    const processRemoveAllListenersSpy = sinon.spy(processMock, 'removeAllListeners');

    sinon.spy(UrlValidator, 'validatePort');
    sinon.stub(shell, 'findPid').returns(Promise.resolve(Number.NaN));
    sinon.stub(outputCommandHelper, 'spawnProcess').returns(processMock as cp.ChildProcess);
    sinon
      .stub(DashboardServiceClient, 'waitDashboardStarted')
      .throws(new Error(Constants.dashboardCommandStrings.cannotStartServer));

    // Act and Assert
    await assert.rejects(
      DashboardService.startDashboardServer(defaultPort),
      Error,
      Constants.dashboardCommandStrings.cannotStartServer
    );
    assert.strictEqual(killProcessStub.calledOnce, true);
    assert.strictEqual(processRemoveAllListenersSpy.calledOnce, true);
  });

  describe('Test cases with "dashboardProcesses"', () => {
    beforeEach(() => {
      DashboardService.dashboardProcesses[defaultPort] = {
        output: channel,
        port: defaultPort,
        process: processMock,
      } as DashboardService.IDashboardProcess;
    });

    afterEach(() => {
      Object.keys(DashboardService.dashboardProcesses).forEach((port) => {
        delete DashboardService.dashboardProcesses[port];
      });
    });

    it('stopDashboardServer should kill process and remove element from "dashboardProcesses" list', async () => {
      // Arrange
      const killPidStub = sinon.stub(shell, 'killPid');
      const killProcessStub = sinon.stub(processMock, 'kill');
      const processSpy = sinon.spy(processMock, 'removeAllListeners');

      DashboardService.dashboardProcesses[defaultPort] = {
        port: defaultPort,
        process: processMock,
      } as DashboardService.IDashboardProcess;

      // Act
      await DashboardService.stopDashboardServer(defaultPort);

      // Assert
      assert.strictEqual(DashboardService.dashboardProcesses[defaultPort], undefined);
      assert.strictEqual(killPidStub.called, false, '"killPid" shouldn\'t be executed for target process');
      assert.strictEqual(killProcessStub.calledOnce, true, '"kill" should be executed for target process');
      assert.strictEqual(processSpy.calledOnce, true, '"removeAllListeners" should be executed for target process');
    });

    it('stopDashboardServer should kill out of band process and remove element from "dashboardProcesses" list', async () => {
      // Arrange
      const killPidStub = sinon.stub(shell, 'killPid');
      const killProcessStub = sinon.stub(processMock, 'kill');
      const processSpy = sinon.spy(processMock, 'removeAllListeners');
      const channelDisposeSpy = sinon.spy(channel, 'dispose');

      DashboardService.dashboardProcesses[defaultPort] = {
        pid: 321,
        port: defaultPort,
      } as DashboardService.IDashboardProcess;

      // Act
      await DashboardService.stopDashboardServer(defaultPort);

      // Assert
      assert.strictEqual(DashboardService.dashboardProcesses[defaultPort], undefined);
      assert.strictEqual(killPidStub.called, true, '"killPid" should be executed for target process');
      assert.strictEqual(killProcessStub.calledOnce, false, '"kill" shouldn\'t be executed for target process');
      assert.strictEqual(processSpy.calledOnce, false, '"removeAllListeners" shouldn\'t be executed for process');
      assert.strictEqual(channelDisposeSpy.calledOnce, false, '"dispose" shouldn\'t be executed for channel');
    });

    it('dispose should kill all process and cleanup "dashboardProcesses" list', async () => {
      // Arrange
      const killPidStub = sinon.stub(shell, 'killPid');
      const killProcessStub = sinon.stub(processMock, 'kill');

      // Act
      await DashboardService.dispose();

      // Assert
      assert.strictEqual(DashboardService.dashboardProcesses[defaultPort], undefined);
      assert.strictEqual(killProcessStub.callCount, 1, '"kill" should be executed for two target process');
      assert.strictEqual(killPidStub.callCount, 0, '"killPid" shouldn\'t be executed');
    });
  });
});
