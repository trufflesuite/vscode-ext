// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {INetwork} from '@/helpers/ConfigurationReader';
import assert from 'assert';
import path from 'path';
import sinon, {stub} from 'sinon';
import uuid from 'uuid';
import vscode, {Uri} from 'vscode';
import {TruffleCommands} from '@/commands';
import {Constants} from '@/Constants';
import * as helpers from '../../src/helpers';
import * as requiredHelpers from '../../src/helpers/required';
import * as TruffleConfiguration from '@/helpers/TruffleConfiguration';
import {TruffleConfig} from '@/helpers/TruffleConfiguration';
import * as commands from '../../src/helpers/command';
import {CancellationEvent} from '@/Models';
import {
  IExtensionItem,
  InfuraNetworkNode,
  InfuraProject,
  InfuraService,
  LocalNetworkNode,
  LocalProject,
  LocalService,
  Service,
  TLocalProjectOptions,
} from '@/Models/TreeItems';
import {DashboardService, GanacheService, TreeManager} from '@/services';
import {TestConstants} from '../TestConstants';
const {service} = Constants.treeItemData;
const description = '';

const options: TLocalProjectOptions = {
  isForked: false,
  forkedNetwork: '',
  blockNumber: 0,
  url: '',
};

const truffleWorkspace: Uri = Uri.parse(path.join(__dirname, TestConstants.truffleCommandTestDataFolder));

describe('TruffleCommands', () => {
  describe('Integration test', async () => {
    describe('deployContracts', () => {
      let requiredMock: sinon.SinonMock;
      let checkAppsSilentMock: sinon.SinonExpectation;
      let installTruffleMock: sinon.SinonExpectation;
      let isHdWalletProviderRequiredMock: sinon.SinonExpectation;
      let checkHdWalletProviderVersionMock: sinon.SinonExpectation;
      let installTruffleHdWalletProviderMock: sinon.SinonExpectation;

      let getWorkspacesMock: any;

      let showQuickPickMock: sinon.SinonStub;
      let showInputBoxMock: sinon.SinonStub;
      let showInformationMessageMock: any;

      let ganacheServiceMock: sinon.SinonMock;
      let startGanacheServerMock: sinon.SinonExpectation;

      let dashboardServiceMock: sinon.SinonMock;
      let startDashboardServerMock: sinon.SinonExpectation;

      let getItemsMock: sinon.SinonStub<[], IExtensionItem[]>;
      let loadStateMock: sinon.SinonStub<[], IExtensionItem[]>;
      let servicesItems: Service[];

      let truffleConfigSetNetworkMock: any;
      let truffleConfigGetNetworkMock: any;
      let truffleConfigGenerateMnemonicMock: any;

      let commandContextMock: sinon.SinonMock;
      let executeCommandMock: sinon.SinonExpectation;

      beforeEach(async () => {
        getWorkspacesMock = stub(helpers, 'getWorkspace');
        getWorkspacesMock.returns(truffleWorkspace);

        requiredMock = sinon.mock(requiredHelpers.required);
        checkAppsSilentMock = requiredMock.expects('checkAppsSilent');
        installTruffleMock = requiredMock.expects('installTruffle');
        isHdWalletProviderRequiredMock = requiredMock.expects('isHdWalletProviderRequired');
        checkHdWalletProviderVersionMock = requiredMock.expects('checkHdWalletProviderVersion');
        installTruffleHdWalletProviderMock = requiredMock.expects('installTruffleHdWalletProvider');
        isHdWalletProviderRequiredMock.returns(false);
        checkHdWalletProviderVersionMock.returns(false);

        showQuickPickMock = sinon.stub(vscode.window, 'showQuickPick');
        showInputBoxMock = sinon.stub(vscode.window, 'showInputBox');
        sinon.stub(vscode.window, 'showErrorMessage');
        showInformationMessageMock = sinon.stub(vscode.window, 'showInformationMessage');

        ganacheServiceMock = sinon.mock(GanacheService);
        startGanacheServerMock = ganacheServiceMock.expects('startGanacheServer');

        dashboardServiceMock = sinon.mock(DashboardService);
        startDashboardServerMock = dashboardServiceMock.expects('startDashboardServer');

        getItemsMock = sinon.stub(TreeManager, 'getItems');
        loadStateMock = sinon.stub(TreeManager, 'loadState');
        servicesItems = await createTestServicesItems();
        getItemsMock.returns(servicesItems);
        loadStateMock.returns(servicesItems);

        truffleConfigSetNetworkMock = sinon.stub(TruffleConfig.prototype, 'setNetworks');
        truffleConfigGetNetworkMock = sinon.stub(TruffleConfig.prototype, 'getNetworks');
        truffleConfigGetNetworkMock.returns(getTestTruffleNetworks());
        truffleConfigGenerateMnemonicMock = sinon.stub(TruffleConfiguration, 'generateMnemonic');
        truffleConfigGenerateMnemonicMock.returns(TestConstants.testMnemonic);

        commandContextMock = sinon.mock(commands);
        executeCommandMock = commandContextMock.expects('executeCommand');
      });

      afterEach(() => {
        sinon.restore();
      });

      it('should throw exception when config file not found', async () => {
        // Arrange
        getWorkspacesMock.returns(__dirname);
        executeCommandMock.returns(uuid.v4());

        // Act and assert
        await assert.rejects(
          TruffleCommands.deployContracts(),
          Error,
          Constants.errorMessageStrings.TruffleConfigIsNotExist
        );
      });

      it('should throw cancellationEvent when showQuickPick return undefined', async () => {
        // Arrange
        executeCommandMock.returns(uuid.v4());
        showQuickPickMock.returns(undefined);

        // Act and assert
        await assert.rejects(TruffleCommands.deployContracts(), CancellationEvent);
      });

      it('should install TruffleHdWalletProvider when it required', async () => {
        // Arrange
        checkAppsSilentMock.returns(true);
        isHdWalletProviderRequiredMock.returns(true);
        checkHdWalletProviderVersionMock.returns(false);
        executeCommandMock.returns(uuid.v4());
        showInformationMessageMock.returns(Constants.informationMessage.installButton);

        showQuickPickMock.onCall(0).callsFake((items: any) => {
          return items.find((item: any) => item.label === TestConstants.servicesNames.development);
        });

        // Act
        await TruffleCommands.deployContracts();

        // Assert
        assert.strictEqual(showQuickPickMock.calledOnce, true, 'showQuickPick should be called once');
        assert.strictEqual(showInputBoxMock.called, false, 'showInputBox should not be called');
        assert.strictEqual(checkAppsSilentMock.calledOnce, true, 'checkAppsSilent should be called once');
        assert.strictEqual(installTruffleMock.called, false, 'installTruffle should not be called');
        assert.strictEqual(getWorkspacesMock.called, true, 'getWorkspacesMock should be called');
        assert.strictEqual(executeCommandMock.called, true, 'executeCommand should be called');
        assert.strictEqual(startGanacheServerMock.called, true, 'startGanacheServer should be called');
        assert.strictEqual(startDashboardServerMock.called, false, 'startDashboardServer should not be called');
        assert.strictEqual(truffleConfigSetNetworkMock.called, false, 'truffleConfig.setNetwork should not be called');
        assert.strictEqual(
          isHdWalletProviderRequiredMock.calledOnce,
          true,
          'isHdWalletProviderRequired should be called'
        );
        assert.strictEqual(
          checkHdWalletProviderVersionMock.calledOnce,
          true,
          'checkHdWalletProviderVersion should be called'
        );
        assert.strictEqual(
          installTruffleHdWalletProviderMock.calledOnce,
          true,
          'installTruffleHdWalletProvider should be called'
        );
      });

      it('should not install TruffleHdWalletProvider when it version correct', async () => {
        // Arrange
        checkAppsSilentMock.returns(true);
        isHdWalletProviderRequiredMock.returns(true);
        checkHdWalletProviderVersionMock.returns(true);
        executeCommandMock.returns(uuid.v4());

        showQuickPickMock.onCall(0).callsFake((items: any) => {
          return items.find((item: any) => item.label === TestConstants.servicesNames.development);
        });

        // Act
        await TruffleCommands.deployContracts();

        // Assert
        assert.strictEqual(showQuickPickMock.calledOnce, true, 'showQuickPick should be called once');
        assert.strictEqual(showInputBoxMock.called, false, 'showInputBox should not be called');
        assert.strictEqual(checkAppsSilentMock.calledOnce, true, 'checkAppsSilent should be called once');
        assert.strictEqual(installTruffleMock.called, false, 'installTruffle should not be called');
        assert.strictEqual(getWorkspacesMock.called, true, 'getWorkspacesMock should be called');
        assert.strictEqual(executeCommandMock.called, true, 'executeCommand should be called');
        assert.strictEqual(startGanacheServerMock.called, true, 'startGanacheServer should be called');
        assert.strictEqual(startDashboardServerMock.called, false, 'startDashboardServer should not be called');
        assert.strictEqual(truffleConfigSetNetworkMock.called, false, 'truffleConfig.setNetwork should not be called');
        assert.strictEqual(
          isHdWalletProviderRequiredMock.calledOnce,
          true,
          'isHdWalletProviderRequired should be called'
        );
        assert.strictEqual(
          checkHdWalletProviderVersionMock.calledOnce,
          true,
          'checkHdWalletProviderVersion should be called'
        );
        assert.strictEqual(
          installTruffleHdWalletProviderMock.calledOnce,
          false,
          'installTruffleHdWalletProvider should not be called'
        );
      });

      it('to development should throw exception when there is an error on command execution', async () => {
        // Arrange
        checkAppsSilentMock.returns(true);
        executeCommandMock.throws(TestConstants.testError);

        showQuickPickMock.callsFake((items: any) => {
          return items.find((item: any) => item.label === TestConstants.servicesNames.development);
        });

        // Act and assert
        await assert.rejects(TruffleCommands.deployContracts(), Error);

        assert.strictEqual(showQuickPickMock.calledOnce, true, 'showQuickPick should be called once');
        assert.strictEqual(showInputBoxMock.called, false, 'showInputBox should not be called');
        assert.strictEqual(checkAppsSilentMock.calledOnce, true, 'checkAppsSilent should be called once');
        assert.strictEqual(installTruffleMock.called, false, 'installTruffle should not be called');
        assert.strictEqual(getWorkspacesMock.called, true, 'getWorkspacesMock should be called');
        assert.strictEqual(executeCommandMock.called, true, 'executeCommand should be called');
        assert.strictEqual(startGanacheServerMock.called, true, 'startGanacheServer should be called');
        assert.strictEqual(startDashboardServerMock.called, false, 'startDashboardServer should not be called');
        assert.strictEqual(truffleConfigSetNetworkMock.called, false, 'truffleConfig.setNetwork should not be called');
        assert.strictEqual(
          isHdWalletProviderRequiredMock.calledOnce,
          true,
          'isHdWalletProviderRequired should be called'
        );
        assert.strictEqual(
          checkHdWalletProviderVersionMock.calledOnce,
          false,
          'checkHdWalletProviderVersion should not be called'
        );
        assert.strictEqual(
          installTruffleHdWalletProviderMock.calledOnce,
          false,
          'installTruffleHdWalletProvider should not be called'
        );
      });

      it('to network should complete successfully', async () => {
        // Arrange
        checkAppsSilentMock.returns(true);
        executeCommandMock.returns(uuid.v4());

        showQuickPickMock.onCall(0).callsFake((items: any) => {
          return items.find((item: any) => item.label === TestConstants.servicesNames.testNetwork);
        });

        // Act
        await TruffleCommands.deployContracts();

        // Assert
        assert.strictEqual(showQuickPickMock.calledOnce, true, 'showQuickPick should be called once');
        assert.strictEqual(showInputBoxMock.called, false, 'showInputBox should not be called');
        assert.strictEqual(checkAppsSilentMock.calledOnce, true, 'checkAppsSilent should be called once');
        assert.strictEqual(installTruffleMock.called, false, 'installTruffle should not be called');
        assert.strictEqual(getWorkspacesMock.called, true, 'getWorkspacesMock should be called');
        assert.strictEqual(executeCommandMock.called, true, 'executeCommand should be called');
        assert.strictEqual(startGanacheServerMock.called, false, 'startGanacheServer should not be called');
        assert.strictEqual(startDashboardServerMock.called, false, 'startDashboardServer should not be called');
        assert.strictEqual(truffleConfigSetNetworkMock.called, false, 'truffleConfig.setNetwork should not be called');
        assert.strictEqual(
          isHdWalletProviderRequiredMock.calledOnce,
          true,
          'isHdWalletProviderRequired should be called'
        );
        assert.strictEqual(
          checkHdWalletProviderVersionMock.calledOnce,
          false,
          'checkHdWalletProviderVersion should not be called'
        );
        assert.strictEqual(
          installTruffleHdWalletProviderMock.calledOnce,
          false,
          'installTruffleHdWalletProvider should not be called'
        );
      });

      it('to network should throw exception when there is an error on command execution', async () => {
        // Arrange
        checkAppsSilentMock.returns(true);
        executeCommandMock.throws(TestConstants.testError);

        showQuickPickMock.onCall(0).callsFake((items: any) => {
          return items.find((item: any) => item.label === TestConstants.servicesNames.testNetwork);
        });

        // Act and assert
        await assert.rejects(TruffleCommands.deployContracts());
        assert.strictEqual(showQuickPickMock.calledOnce, true, 'showQuickPick should be called once');
        assert.strictEqual(showInputBoxMock.called, false, 'showInputBox should not be called');
        assert.strictEqual(checkAppsSilentMock.calledOnce, true, 'checkAppsSilent should be called once');
        assert.strictEqual(installTruffleMock.called, false, 'installTruffle should not be called');
        assert.strictEqual(getWorkspacesMock.called, true, 'getWorkspacesMock should be called');
        assert.strictEqual(executeCommandMock.called, true, 'executeCommand should be called');
        assert.strictEqual(startGanacheServerMock.called, false, 'startGanacheServer should not be called');
        assert.strictEqual(startDashboardServerMock.called, false, 'startDashboardServer should not be called');
        assert.strictEqual(truffleConfigSetNetworkMock.called, false, 'truffleConfig.setNetwork should not be called');
        assert.strictEqual(
          isHdWalletProviderRequiredMock.calledOnce,
          true,
          'isHdWalletProviderRequired should be called'
        );
        assert.strictEqual(
          checkHdWalletProviderVersionMock.calledOnce,
          false,
          'checkHdWalletProviderVersion should not be called'
        );
        assert.strictEqual(
          installTruffleHdWalletProviderMock.calledOnce,
          false,
          'installTruffleHdWalletProvider should not be called'
        );
      });

      it('to local network should complete successfully', async () => {
        // Arrange
        const {local} = TestConstants.networkNames;
        checkAppsSilentMock.returns(true);
        executeCommandMock.returns(uuid.v4());

        const networkNodeName = getDeployName(service.local.prefix, local, local);

        showQuickPickMock.onCall(0).callsFake((items: any) => {
          return items.find((item: any) => item.label === networkNodeName);
        });

        // Act
        await TruffleCommands.deployContracts();

        // Assert
        assert.strictEqual(showQuickPickMock.calledOnce, true, 'showQuickPick should be called once');
        assert.strictEqual(showInputBoxMock.called, false, 'showInputBox should not be called');
        assert.strictEqual(checkAppsSilentMock.calledOnce, true, 'checkAppsSilent should be called once');
        assert.strictEqual(installTruffleMock.called, false, 'installTruffle should not be called');
        assert.strictEqual(getWorkspacesMock.called, true, 'getWorkspacesMock should be called');
        assert.strictEqual(executeCommandMock.called, true, 'executeCommand should be called');
        assert.strictEqual(startGanacheServerMock.called, true, 'startGanacheServer should be called');
        assert.strictEqual(startDashboardServerMock.called, false, 'startDashboardServer should not be called');
        assert.strictEqual(truffleConfigSetNetworkMock.called, true, 'truffleConfig.setNetwork should be called');
        assert.strictEqual(
          isHdWalletProviderRequiredMock.calledOnce,
          true,
          'isHdWalletProviderRequired should be called'
        );
        assert.strictEqual(
          checkHdWalletProviderVersionMock.calledOnce,
          false,
          'checkHdWalletProviderVersion should not be called'
        );
        assert.strictEqual(
          installTruffleHdWalletProviderMock.calledOnce,
          false,
          'installTruffleHdWalletProvider should not be called'
        );
      });

      it('to local network should throw exception when there is an error on command execution', async () => {
        // Arrange
        const {local} = TestConstants.networkNames;
        checkAppsSilentMock.returns(true);
        executeCommandMock.throws(TestConstants.testError);

        const networkNodeName = getDeployName(service.local.prefix, local, local);

        showQuickPickMock.onCall(0).callsFake((items: any) => {
          return items.find((item: any) => item.label === networkNodeName);
        });

        // Act and assert
        await assert.rejects(TruffleCommands.deployContracts());
        assert.strictEqual(showQuickPickMock.calledOnce, true, 'showQuickPick should be called once');
        assert.strictEqual(showInputBoxMock.called, false, 'showInputBox should not be called');
        assert.strictEqual(checkAppsSilentMock.calledOnce, true, 'checkAppsSilent should be called once');
        assert.strictEqual(installTruffleMock.called, false, 'installTruffle should not be called');
        assert.strictEqual(getWorkspacesMock.called, true, 'getWorkspacesMock should be called');
        assert.strictEqual(executeCommandMock.called, true, 'executeCommand should be called');
        assert.strictEqual(startGanacheServerMock.called, true, 'startGanacheServer should be called');
        assert.strictEqual(startDashboardServerMock.called, false, 'startDashboardServer should not be called');
        assert.strictEqual(truffleConfigSetNetworkMock.called, true, 'truffleConfig.setNetwork should be called');
        assert.strictEqual(
          isHdWalletProviderRequiredMock.calledOnce,
          true,
          'isHdWalletProviderRequired should be called'
        );
        assert.strictEqual(
          checkHdWalletProviderVersionMock.calledOnce,
          false,
          'checkHdWalletProviderVersion should not be called'
        );
        assert.strictEqual(
          installTruffleHdWalletProviderMock.calledOnce,
          false,
          'installTruffleHdWalletProvider should not be called'
        );
      });

      it('to dashboard should complete successfully', async () => {
        // Arrange
        checkAppsSilentMock.returns(true);
        executeCommandMock.returns(uuid.v4());

        showQuickPickMock.onCall(0).callsFake((items: any) => {
          return items.find((item: any) => item.label === Constants.uiCommandStrings.deployViaTruffleDashboard);
        });

        // Act
        await TruffleCommands.deployContracts();

        // Assert
        assert.strictEqual(showQuickPickMock.calledOnce, true, 'showQuickPick should be called once');
        assert.strictEqual(showInputBoxMock.called, false, 'showInputBox should not be called');
        assert.strictEqual(checkAppsSilentMock.calledOnce, true, 'checkAppsSilent should be called once');
        assert.strictEqual(installTruffleMock.called, false, 'installTruffle should not be called');
        assert.strictEqual(getWorkspacesMock.called, true, 'getWorkspacesMock should be called');
        assert.strictEqual(executeCommandMock.called, true, 'executeCommand should be called');
        assert.strictEqual(startGanacheServerMock.called, false, 'startGanacheServer should not be called');
        assert.strictEqual(startDashboardServerMock.called, true, 'startDashboardServer should be called');
        assert.strictEqual(truffleConfigSetNetworkMock.called, false, 'truffleConfig.setNetwork should not be called');
        assert.strictEqual(
          isHdWalletProviderRequiredMock.calledOnce,
          true,
          'isHdWalletProviderRequired should be called'
        );
        assert.strictEqual(
          checkHdWalletProviderVersionMock.calledOnce,
          false,
          'checkHdWalletProviderVersion should not be called'
        );
        assert.strictEqual(
          installTruffleHdWalletProviderMock.calledOnce,
          false,
          'installTruffleHdWalletProvider should not be called'
        );
      });

      it('to dashboard should throw exception when there is an error on command execution', async () => {
        // Arrange
        checkAppsSilentMock.returns(true);
        executeCommandMock.throws(TestConstants.testError);

        showQuickPickMock.onCall(0).callsFake((items: any) => {
          return items.find((item: any) => item.label === Constants.uiCommandStrings.deployViaTruffleDashboard);
        });

        // Act and assert
        await assert.rejects(TruffleCommands.deployContracts());
        assert.strictEqual(showQuickPickMock.calledOnce, true, 'showQuickPick should be called once');
        assert.strictEqual(showInputBoxMock.called, false, 'showInputBox should not be called');
        assert.strictEqual(checkAppsSilentMock.calledOnce, true, 'checkAppsSilent should be called once');
        assert.strictEqual(installTruffleMock.called, false, 'installTruffle should not be called');
        assert.strictEqual(getWorkspacesMock.called, true, 'getWorkspacesMock should be called');
        assert.strictEqual(executeCommandMock.called, true, 'executeCommand should be called');
        assert.strictEqual(startGanacheServerMock.called, false, 'startGanacheServer should not be called');
        assert.strictEqual(startDashboardServerMock.called, true, 'startDashboardServer should be called');
        assert.strictEqual(truffleConfigSetNetworkMock.called, false, 'truffleConfig.setNetwork should not be called');
        assert.strictEqual(
          isHdWalletProviderRequiredMock.calledOnce,
          true,
          'isHdWalletProviderRequired should be called'
        );
        assert.strictEqual(
          checkHdWalletProviderVersionMock.calledOnce,
          false,
          'checkHdWalletProviderVersion should not be called'
        );
        assert.strictEqual(
          installTruffleHdWalletProviderMock.calledOnce,
          false,
          'installTruffleHdWalletProvider should not be called'
        );
      });
    });
  });
});

async function createTestServicesItems(): Promise<Service[]> {
  const services: Service[] = [];

  const localService = new LocalService();
  const infuraService = new InfuraService();

  const defaultPort = 8545;
  const defaultLabel = TestConstants.servicesNames.development;
  const localProject = new LocalProject(defaultLabel, defaultPort, options, description);
  const defaultUrl = `${Constants.networkProtocols.http}${Constants.localhost}:${defaultPort}`;
  const localNetworkNode = new LocalNetworkNode(defaultLabel, defaultUrl, '*');
  localProject.addChild(localNetworkNode);

  const infuraProject = new InfuraProject(uuid.v4(), uuid.v4());
  const infuraNetworkNode = new InfuraNetworkNode(uuid.v4(), uuid.v4(), uuid.v4());
  infuraProject.addChild(infuraNetworkNode);

  localService.addChild(localProject);
  infuraService.addChild(infuraProject);

  services.push(localService, infuraService);

  return services;
}

function getTestTruffleNetworks(): INetwork[] {
  const networks: INetwork[] = [];

  networks.push(
    {
      name: TestConstants.servicesNames.development,
      options: {
        host: '127.0.0.1',
        network_id: '*',
        port: 8545,
      },
    },
    {
      name: TestConstants.servicesNames.testNetwork,
      options: {
        gasPrice: 100000000000,
        network_id: 2,
      },
    }
  );

  return networks;
}

function getDeployName(prefix: string, projectName: string, nodeName: string, args?: string[]): string {
  if (args) {
    return [prefix, projectName, ...args, nodeName].join('_');
  }

  return [prefix, projectName, nodeName].join('_');
}
