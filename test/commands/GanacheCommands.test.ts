// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import assert from 'assert';
import type {ChildProcess} from 'child_process';
import sinon from 'sinon';
import {commands, type OutputChannel, type QuickPickItem, window} from 'vscode';
import {GanacheCommands} from '@/commands/GanacheCommands';
import {Constants, RequiredApps} from '../../src/Constants';
import * as userInteraction from '../../src/helpers/userInteraction';
import {required} from '../../src/helpers/required';
import * as shell from '../../src/helpers/shell';
import {LocalProject, type TLocalProjectOptions} from '@/Models/TreeItems/LocalProject';
import type {IExtensionItem} from '@/Models/TreeItems/IExtensionItem';
import {LocalService} from '@/Models/TreeItems/LocalService';
import type {Service} from '@/Models/TreeItems/Service';
import {GanacheService} from '@/services/ganache/GanacheService';
import {TreeManager} from '@/services/tree/TreeManager';
import * as GanacheServiceClient from '../../src/services/ganache/GanacheServiceClient';
import {ProjectView} from '@/views/NetworksView';
import {TestConstants} from '../TestConstants';

const description = '';

const options: TLocalProjectOptions = {
  isForked: false,
  forkedNetwork: '',
  blockNumber: 0,
  url: '',
};

describe('Unit tests GanacheCommands', () => {
  let checkAppsStub: sinon.SinonStub<RequiredApps[], Promise<boolean>>;

  let getItemsMock: sinon.SinonStub<[], IExtensionItem[]>;
  let testServiceItems: Service[];
  let loadStateMock: sinon.SinonStub<[], IExtensionItem[]>;
  let projectView: ProjectView;

  before(async () => {
    testServiceItems = await createTestServiceItems();
    getItemsMock = sinon.stub(TreeManager, 'getItems');
    getItemsMock.returns(testServiceItems);
    loadStateMock = sinon.stub(TreeManager, 'loadState');
    loadStateMock.returns(testServiceItems);

    projectView = new ProjectView(new LocalProject('test consortium', testPort, options, description));
  });

  afterEach(() => {
    sinon.restore();
  });

  it('startGanacheCmd executes truffle-vscode.showRequirementsPage cmd when not all app are installed', async () => {
    // Arrange
    checkAppsStub = sinon.stub(required, 'checkApps').returns(Promise.resolve(false));
    const executeCommandStub = sinon.stub(commands, 'executeCommand');
    // sinon.replace(GanacheCommands, 'selectGanachePortAndOptions', async () => { return { port: 99, options } });

    // Act
    await GanacheCommands.startGanacheCmd(() => Promise.resolve(projectView.extensionItem as LocalProject));

    // Assert
    assert.strictEqual(checkAppsStub.called, true, 'should check installed apps');
    assert.strictEqual(checkAppsStub.getCall(0).args[0], RequiredApps.node, 'should check "node" version');
    assert.strictEqual(executeCommandStub.called, true, 'should execute installation command');
  });

  it('startGanacheCmd shows information message when server already running', async () => {
    // Arrange
    checkAppsStub = sinon.stub(required, 'checkApps').returns(Promise.resolve(true));
    const startGanacheServerStub = sinon
      .stub(GanacheService, 'startGanacheServer')
      .returns(Promise.resolve({pid: 1234, port: testPort}));
    const showInformationMessageStub = sinon.stub(window, 'showInformationMessage');

    // Act
    await GanacheCommands.startGanacheCmd(() => Promise.resolve(projectView.extensionItem as LocalProject));

    // Assert
    assert.strictEqual(checkAppsStub.called, true, 'should check installed apps');
    assert.strictEqual(startGanacheServerStub.called, true, 'should try to start Ganache server');
    assert.strictEqual(
      startGanacheServerStub.getCall(0).args[0],
      testPort,
      'should try to start Ganache server on current port'
    );
    assert.strictEqual(
      showInformationMessageStub.getCall(0).args[0],
      Constants.ganacheCommandStrings.serverAlreadyRunning,
      'should show "already running" information message'
    );
  });

  it('startGanacheCmd should start server and show message', async () => {
    // Arrange
    checkAppsStub = sinon.stub(required, 'checkApps').returns(Promise.resolve(true));
    const ganacheProcess = {
      output: {
        name: 'channel name',
      } as OutputChannel,
      port: testPort,
      process: {} as ChildProcess,
    };
    const showInformationMessageStub = sinon.stub(window, 'showInformationMessage');
    const startGanacheServerStub = sinon
      .stub(GanacheService, 'startGanacheServer')
      .returns(Promise.resolve(ganacheProcess));

    // Act
    await GanacheCommands.startGanacheCmd(() => Promise.resolve(projectView.extensionItem as LocalProject));

    // Assert
    assert.strictEqual(checkAppsStub.called, true, 'should check installed apps');
    assert.strictEqual(startGanacheServerStub.called, true, 'should try to start Ganache server');
    assert.strictEqual(
      startGanacheServerStub.getCall(0).args[0],
      testPort,
      'should try to start Ganache server on current port'
    );
    assert.strictEqual(
      showInformationMessageStub.getCall(0).args[0],
      Constants.ganacheCommandStrings.serverSuccessfullyStarted,
      'should show "successfully started" information message'
    );
  });

  it('stopGanacheCmd should show message when no server on current port', async () => {
    // Arrange
    const isGanacheServerStub = sinon.stub(GanacheServiceClient, 'isGanacheServer');
    const showWarningMessageStub = sinon.stub(window, 'showInformationMessage');
    sinon.stub(shell, 'findPid').returns(Promise.resolve(Number.NaN));

    // Act
    await GanacheCommands.stopGanacheCmd(projectView);

    // Assert
    assert.strictEqual(isGanacheServerStub.called, false, 'should check installed apps');
    assert.strictEqual(
      showWarningMessageStub.getCall(0).args[0],
      Constants.ganacheCommandStrings.serverSuccessfullyStopped,
      'should show "server successfully stopped" information message'
    );
  });

  it('stopGanacheCmd should stop server and show message', async () => {
    // Arrange
    const isGanacheServerStub = sinon.stub(GanacheServiceClient, 'isGanacheServer').returns(Promise.resolve(true));
    const showInformationMessageStub = sinon.stub(window, 'showInformationMessage');
    const stopGanacheServerStub = sinon.stub(GanacheService, 'stopGanacheServer');
    sinon.stub(shell, 'findPid').returns(Promise.resolve(312));

    // Act
    await GanacheCommands.stopGanacheCmd(projectView);

    // Assert
    assert.strictEqual(isGanacheServerStub.called, true, 'should check for port for Ganache server');
    assert.strictEqual(
      isGanacheServerStub.getCall(0).args[0],
      testPort,
      'should check current port for Ganache server'
    );
    assert.strictEqual(
      showInformationMessageStub.getCall(0).args[0],
      Constants.ganacheCommandStrings.serverSuccessfullyStopped,
      'should show "server successfully stopped" information message'
    );
    assert.strictEqual(stopGanacheServerStub.getCall(0).args[0], testPort, 'should stop server on current port');
  });

  it('`selectGanachePortAndOptions` ProjectView item passed', async () => {
    // Act
    const result = await GanacheCommands.selectGanachePortAndOptions(projectView);

    // Assert
    assert.deepEqual(result, {port: testPort, options}, 'should return correct port and options');
  });

  it('`selectGanachePortAndOptions` tree manager contains LOCAL_SERVICE item with children', async () => {
    // Arrange
    sinon.stub(TreeManager, 'getItem').returns(new LocalService());
    sinon.stub(userInteraction, 'showQuickPick').returns(Promise.resolve(localProject as QuickPickItem));
    // Act
    const result = await GanacheCommands.selectGanachePortAndOptions();

    // Assert
    assert.deepEqual(result, {port: testPort, options}, 'should return correct port and options');
  });
});

const testPort = 8544;
const localProject = new LocalProject(TestConstants.servicesNames.localProject, testPort, options, description);

async function createTestServiceItems(): Promise<Service[]> {
  const services: Service[] = [];

  const localService = new LocalService();
  localService.addChild(localProject);
  services.push(localService);

  return services;
}
