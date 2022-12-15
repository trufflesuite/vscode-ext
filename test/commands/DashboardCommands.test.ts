// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import assert from 'assert';
import {ChildProcess} from 'child_process';
import sinon from 'sinon';
import {OutputChannel, window} from 'vscode';
import {DashboardCommands} from '@/commands/DashboardCommands';
import {Constants, RequiredApps} from '@/Constants';
import {required} from '@/helpers/required';
import * as shell from '../../src/helpers/shell';
import {DashboardService} from '@/services/dashboard/DashboardService';
import * as DashboardServiceClient from '../../src/services/dashboard/DashboardServiceClient';

describe('Unit tests DashboardCommands', () => {
  let checkDashboardVersionStub: sinon.SinonStub<RequiredApps[], Promise<boolean>>;

  afterEach(() => {
    sinon.restore();
  });

  it('startDashboardCmd shows information message when server already running', async () => {
    // Arrange
    checkDashboardVersionStub = sinon.stub(required, 'checkDashboardVersion').returns(Promise.resolve(true));
    const startDashboardServerStub = sinon
      .stub(DashboardService, 'startDashboardServer')
      .returns(Promise.resolve({pid: 1234, port: Constants.dashboardPort}));
    const showInformationMessageStub = sinon.stub(window, 'showInformationMessage');

    // Act
    await DashboardCommands.startDashboardCmd();

    // Assert
    assert.strictEqual(checkDashboardVersionStub.called, true, 'should check truffle version');
    assert.strictEqual(startDashboardServerStub.called, true, 'should try to start Dashboard server');
    assert.strictEqual(
      startDashboardServerStub.getCall(0).args[0],
      Constants.dashboardPort,
      'should try to start Dashboard server on current port'
    );
    assert.strictEqual(
      showInformationMessageStub.getCall(0).args[0],
      Constants.dashboardCommandStrings.serverAlreadyRunning,
      'should show "already running" information message'
    );
  });

  it('startDashboardCmd should start server and show message', async () => {
    // Arrange
    checkDashboardVersionStub = sinon.stub(required, 'checkDashboardVersion').returns(Promise.resolve(true));
    const dashboardProcess = {
      output: {
        name: 'channel name',
      } as OutputChannel,
      port: Constants.dashboardPort,
      process: {} as ChildProcess,
    };
    const showInformationMessageStub = sinon.stub(window, 'showInformationMessage');
    const startDashboardServerStub = sinon
      .stub(DashboardService, 'startDashboardServer')
      .returns(Promise.resolve(dashboardProcess));

    // Act
    await DashboardCommands.startDashboardCmd();

    // Assert
    assert.strictEqual(checkDashboardVersionStub.called, true, 'should check installed apps');
    assert.strictEqual(startDashboardServerStub.called, true, 'should try to start Dashboard server');
    assert.strictEqual(
      startDashboardServerStub.getCall(0).args[0],
      Constants.dashboardPort,
      'should try to start Dashboard server on current port'
    );
    assert.strictEqual(
      showInformationMessageStub.getCall(0).args[0],
      Constants.dashboardCommandStrings.serverSuccessfullyStarted,
      'should show "successfully started" information message'
    );
  });

  it('stopDashboardCmd should show message when no server on current port', async () => {
    // Arrange
    const isDashboardServerStub = sinon.stub(DashboardServiceClient, 'isDashboardRunning');
    const showWarningMessageStub = sinon.stub(window, 'showInformationMessage');
    sinon.stub(shell, 'findPid').returns(Promise.resolve(Number.NaN));

    // Act
    await DashboardCommands.stopDashboardCmd();

    // Assert
    assert.strictEqual(isDashboardServerStub.called, false, 'should check installed apps');
    assert.strictEqual(
      showWarningMessageStub.getCall(0).args[0],
      Constants.dashboardCommandStrings.serverSuccessfullyStopped,
      'should show "server successfully stopped" information message'
    );
  });

  it('stopDashboardCmd should stop server and show message', async () => {
    // Arrange
    const isDashboardServerStub = sinon
      .stub(DashboardServiceClient, 'isDashboardRunning')
      .returns(Promise.resolve(true));
    const showInformationMessageStub = sinon.stub(window, 'showInformationMessage');
    const stopDashboardServerStub = sinon.stub(DashboardService, 'stopDashboardServer');
    sinon.stub(shell, 'findPid').returns(Promise.resolve(312));

    // Act
    await DashboardCommands.stopDashboardCmd();

    // Assert
    assert.strictEqual(isDashboardServerStub.called, true, 'should check for port for Dashboard server');
    assert.strictEqual(
      isDashboardServerStub.getCall(0).args[0],
      Constants.dashboardPort,
      'should check current port for Dashboard server'
    );
    assert.strictEqual(
      showInformationMessageStub.getCall(0).args[0],
      Constants.dashboardCommandStrings.serverSuccessfullyStopped,
      'should show "server successfully stopped" information message'
    );
    assert.strictEqual(
      stopDashboardServerStub.getCall(0).args[0],
      Constants.dashboardPort,
      'should stop server on current port'
    );
  });
});
