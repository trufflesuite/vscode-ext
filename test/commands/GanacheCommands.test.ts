// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as assert from 'assert';
import { ChildProcess } from 'child_process';
import * as sinon from 'sinon';
import { commands, ExtensionContext, OutputChannel, QuickPickItem, window } from 'vscode';
import { GanacheCommands } from '../../src/commands/GanacheCommands';
import { Constants, RequiredApps } from '../../src/Constants';
import * as GanacheService from '../../src/GanacheService/GanacheService';
import * as GanacheServiceClient from '../../src/GanacheService/GanacheServiceClient';
import * as helpers from '../../src/helpers';
import { required } from '../../src/helpers';
import {
  AzureConsortium,
  IExtensionItem,
  ItemType,
  LocalNetworkConsortium,
  MainNetworkConsortium,
  Network,
  TestNetworkConsortium,
} from '../../src/Models';
import { Output } from '../../src/Output';
import { ConsortiumTreeManager } from '../../src/treeService/ConsortiumTreeManager';
import { ConsortiumView } from '../../src/ViewItems';
import { TestConstants } from '../TestConstants';

describe('Unit tests GanacheCommands', () => {
  let consortiumTreeManager: ConsortiumTreeManager;
  let checkAppsStub: sinon.SinonStub<RequiredApps[], Promise<boolean>>;

  let getItemsMock: sinon.SinonStub<[(boolean | undefined)?], IExtensionItem[]>;
  let testConsortiumItems: Network[];
  let loadStateMock: sinon.SinonStub<[], IExtensionItem[]>;
  let consortiumView: ConsortiumView;

  before(async () => {
    testConsortiumItems = await createTestConsortiumItems();
    getItemsMock = sinon.stub(ConsortiumTreeManager.prototype, 'getItems');
    getItemsMock.returns(testConsortiumItems);
    loadStateMock = sinon.stub(ConsortiumTreeManager.prototype, 'loadState');
    loadStateMock.returns(testConsortiumItems);

    consortiumView = new ConsortiumView(
      new LocalNetworkConsortium('test consortium', `http://microsoft.com:${testPort}`),
    );
    consortiumTreeManager = new ConsortiumTreeManager({} as ExtensionContext);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('startGanacheCmd executes azureBlockchainService.showRequirementsPage cmd when not all app are installed',
    async () => {
      // Arrange
      checkAppsStub = sinon.stub(required, 'checkApps').returns(Promise.resolve(false));
      const executeCommandStub = sinon.stub(commands, 'executeCommand');
      sinon.replace(GanacheCommands, 'getGanachePort', async () => 99);

      // Act
      await GanacheCommands.startGanacheCmd(consortiumTreeManager, consortiumView);

      // Assert
      assert.strictEqual(checkAppsStub.called, true, 'should check installed apps');
      assert.strictEqual(checkAppsStub.getCall(0).args[0], RequiredApps.node, 'should check "node" version');
      assert.strictEqual(executeCommandStub.called, true, 'should execute installation command');
    });

  it('startGanacheCmd shows information message when server already running', async () => {
    // Arrange
    checkAppsStub = sinon.stub(required, 'checkApps').returns(Promise.resolve(true));
    const startGanacheServerStub = sinon.stub(GanacheService.GanacheService, 'startGanacheServer')
      .returns(Promise.resolve(null));
    const showInformationMessageStub = sinon.stub(window, 'showInformationMessage');

    // Act
    await GanacheCommands.startGanacheCmd(consortiumTreeManager, consortiumView);

    // Assert
    assert.strictEqual(checkAppsStub.called, true, 'should check installed apps');
    assert.strictEqual(startGanacheServerStub.called, true, 'should try to start Ganache server');
    assert.strictEqual(
      startGanacheServerStub.getCall(0).args[0],
      testPort,
      'should try to start Ganache server on current port',
    );
    assert.strictEqual(
      showInformationMessageStub.getCall(0).args[0],
      Constants.ganacheCommandStrings.serverAlreadyRunning,
      'should show "already running" information message',
    );
  });

  it('startGanacheCmd should start server and show message', async () => {
    // Arrange
    checkAppsStub = sinon.stub(required, 'checkApps').returns(Promise.resolve(true));
    const ganacheProcess = {
      output: {
        name: 'channel name',
      } as OutputChannel,
      process: {} as ChildProcess,
    };
    const showInformationMessageStub = sinon.stub(window, 'showInformationMessage');
    const startGanacheServerStub = sinon.stub(GanacheService.GanacheService, 'startGanacheServer')
      .returns(Promise.resolve(ganacheProcess));

    // Act
    await GanacheCommands.startGanacheCmd(consortiumTreeManager, consortiumView);

    // Assert
    assert.strictEqual(checkAppsStub.called, true, 'should check installed apps');
    assert.strictEqual(startGanacheServerStub.called, true, 'should try to start Ganache server');
    assert.strictEqual(
      startGanacheServerStub.getCall(0).args[0],
      testPort,
      'should try to start Ganache server on current port',
    );
    assert.strictEqual(
      showInformationMessageStub.getCall(0).args[0],
      Constants.ganacheCommandStrings.serverSuccessfullyStarted,
      'should show "successfully started" information message',
    );
  });

  it('stopGanacheCmd should show message when no server on current port', async () => {
    // Arrange
    const isGanacheServerStub = sinon.stub(GanacheServiceClient, 'isGanacheServer').returns(Promise.resolve(false));
    const outputShowStub = sinon.stub(Output, 'show');
    const showWarningMessageStub = sinon.stub(window, 'showWarningMessage');

    // Act
    await GanacheCommands.stopGanacheCmd(consortiumTreeManager, consortiumView);

    // Assert
    assert.strictEqual(isGanacheServerStub.called, true, 'should check installed apps');
    assert.strictEqual(
      isGanacheServerStub.getCall(0).args[0],
      testPort,
      'should try to start Ganache server on current port',
    );
    assert.strictEqual(
      showWarningMessageStub.getCall(0).args[0],
      Constants.ganacheCommandStrings.serverCanNotStop,
      'should show "server cannot stop" warning message',
    );
    assert.strictEqual(outputShowStub.called, true, 'should move focus to output tab');
  });

  it('stopGanacheCmd should stop server and show message', async () => {
    // Arrange
    const isGanacheServerStub = sinon.stub(GanacheServiceClient, 'isGanacheServer').returns(Promise.resolve(true));
    const outputShowStub = sinon.stub(Output, 'show');
    const showInformationMessageStub = sinon.stub(window, 'showInformationMessage');
    const stopGanacheServerStub = sinon.stub(GanacheService.GanacheService, 'stopGanacheServer');

    // Act
    await GanacheCommands.stopGanacheCmd(consortiumTreeManager, consortiumView);

    // Assert
    assert.strictEqual(isGanacheServerStub.called, true, 'should check for port for Ganache server');
    assert.strictEqual(
      isGanacheServerStub.getCall(0).args[0],
      testPort,
      'should check current port for Ganache server',
    );
    assert.strictEqual(
      showInformationMessageStub.getCall(0).args[0],
      Constants.ganacheCommandStrings.serverSuccessfullyStopped,
      'should show "server successfully stopped" information message',
    );
    assert.strictEqual(stopGanacheServerStub.getCall(0).args[0], testPort, 'should stop server on current port');
    assert.strictEqual(outputShowStub.called, true, 'should move focus to output tab');
  });

  it('getGanachePort LocalNetworkConsortium item passed', async () => {
    // Act
    const result = await GanacheCommands.getGanachePort(consortiumTreeManager, consortiumView);

    // Assert
    assert.strictEqual(result, testPort, 'should execute correct port');
  });

  it('getGanachePort tree manager contains LOCAL_NETWORK item with children', async () => {
    // Arrange
    sinon.stub(helpers, 'showQuickPick')
      .returns(Promise.resolve(localNetworkConsortium as QuickPickItem));

    // Act
    const result = await GanacheCommands.getGanachePort(consortiumTreeManager);

    // Assert
    assert.strictEqual(result, testPort, 'should execute correct port');
  });

  it('getGanachePort tree manager does not contains LOCAL_NETWORK item with children', async () => {
    // Arrange
    sinon.restore(); // to overwrite getItem() wrapping
    sinon.stub(consortiumTreeManager, 'getItem').returns(undefined);

    // Act and Assert
    assert.rejects(
      GanacheCommands.getGanachePort(consortiumTreeManager),
      Error,
      Constants.ganacheCommandStrings.serverNoGanacheAvailable,
    );
  });
});

const testPort = 8544;

const localNetworkConsortium = new LocalNetworkConsortium(
  TestConstants.consortiumTestNames.local,
  `http://127.0.0.1:${testPort}/`,
);
const testNetworkConsortium = new TestNetworkConsortium(
  TestConstants.consortiumTestNames.testEthereum,
  'https://127.0.0.3:1234/',
);
const mainNetworkConsortium = new MainNetworkConsortium(
  TestConstants.consortiumTestNames.publicEthereum,
  'https://127.0.0.4:1234/',
);

async function createTestConsortiumItems(): Promise<Network[]> {
  const networks: Network[] = [];

  const azureNetwork = new Network(TestConstants.networksNames.azureBlockchainService, ItemType.AZURE_BLOCKCHAIN);
  const localNetwork = new Network(TestConstants.networksNames.localNetwork, ItemType.LOCAL_NETWORK);
  const ethereumTestnet = new Network(TestConstants.networksNames.ethereumTestnet, ItemType.ETHEREUM_TEST_NETWORK);
  const ethereumNetwork = new Network(TestConstants.networksNames.ethereumNetwork, ItemType.ETHEREUM_MAIN_NETWORK);

  const azureConsortium = new AzureConsortium(
    TestConstants.networksNames.testConsortium,
    'subscriptionId',
    'resourcesGroup',
    'memberName',
    'https://testConsortium.blockchain.azure.com/',
  );

  azureConsortium.setConsortiumId(1);
  localNetworkConsortium.setConsortiumId(2);
  testNetworkConsortium.setConsortiumId(3);
  mainNetworkConsortium.setConsortiumId(4);

  azureNetwork.addChild(azureConsortium);
  localNetwork.addChild(localNetworkConsortium);
  ethereumTestnet.addChild(testNetworkConsortium);
  ethereumNetwork.addChild(mainNetworkConsortium);

  networks.push(azureNetwork, localNetwork, ethereumNetwork, ethereumTestnet);

  return networks;
}
