// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as assert from 'assert';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as sinon from 'sinon';
import * as uuid from 'uuid';
import * as vscode from 'vscode';
import {
  IAzureBlockchainDataManagerApplicationDto,
  IAzureBlockchainDataManagerDto,
  IAzureBlockchainDataManagerInputDto,
  IAzureBlockchainDataManagerOutputDto,
  IAzureConsortiumDto,
  IAzureTransactionNodeDto,
  IEventGridDto,
} from '../src/ARMBlockchain';
import { TruffleCommands } from '../src/commands/TruffleCommands';
import { Constants } from '../src/Constants';
import * as helpers from '../src/helpers';
import { CancellationEvent } from '../src/Models/CancellationEvent';
import { ItemType } from '../src/Models/ItemType';
import {
  BlockchainDataManagerInstanceItem,
  ConsortiumItem,
  EventGridItem,
  ResourceGroupItem,
  SubscriptionItem,
  TransactionNodeItem,
} from '../src/Models/QuickPickItems';
import { BlockchainDataManagerNetworkNode, BlockchainDataManagerProject } from '../src/Models/TreeItems';
import { StorageAccountResourceExplorer } from '../src/resourceExplorers/StorageAccountResourceExplorer';
import { ContractDB, ContractInstanceWithMetadata, ContractService, TreeManager } from '../src/services';
import { Contract } from '../src/services/contract/Contract';
import { AzureAccountHelper } from './testHelpers/AzureAccountHelper';

describe('Blockchain Data Manager Resource Explorer', () => {
  const blockchainDataManagerResourceExplorerRequire = require('../src/resourceExplorers/BlockchainDataManagerResourceExplorer');
  const blockchainDataManagerResourceExplorer =
    blockchainDataManagerResourceExplorerRequire.BlockchainDataManagerResourceExplorer;

  afterEach(() => {
    sinon.restore();
  });

  describe('Public methods', () => {
    let getOrSelectSubscriptionItemStub: any;
    let getOrCreateResourceGroupItemStub: any;
    let getBlockchainDataManagerInstanceStub: any;

    const subItemTest = {
      subscriptionId: uuid.v4(),
    } as SubscriptionItem;
    const rgItemTest = {
      label: uuid.v4(),
    } as ResourceGroupItem;

    beforeEach(() => {
      sinon.stub(vscode.extensions, 'getExtension').returns(AzureAccountHelper.mockExtension);
      sinon.stub(blockchainDataManagerResourceExplorer.prototype, 'waitForLogin').returns(Promise.resolve(true));
      getOrSelectSubscriptionItemStub = sinon.stub(blockchainDataManagerResourceExplorer.prototype, 'getOrSelectSubscriptionItem')
        .returns(Promise.resolve(subItemTest));
      getOrCreateResourceGroupItemStub = sinon.stub(blockchainDataManagerResourceExplorer.prototype, 'getOrCreateResourceGroupItem')
        .returns(Promise.resolve(rgItemTest));
      getBlockchainDataManagerInstanceStub = sinon.stub(blockchainDataManagerResourceExplorer.prototype, 'getBlockchainDataManagerInstance');
    });

    it('selectProject should return blockchain data manager instance', async () => {
      // Arrange
      sinon.stub(blockchainDataManagerResourceExplorer.prototype, 'getAzureClient').returns(Promise.resolve());
      sinon.stub(blockchainDataManagerResourceExplorer.prototype, 'getBlockchainDataManagerInstanceItems').resolves([]);
      const bdmInstance1 = new BlockchainDataManagerInstanceItem(uuid.v4(), uuid.v4(), uuid.v4(), uuid.v4());
      const showQuickPickStub = sinon.stub().returns(bdmInstance1);
      sinon.replace(helpers, 'showQuickPick', showQuickPickStub);

      // Act
      await blockchainDataManagerResourceExplorer.prototype.selectProject();

      // Assert
      assert.strictEqual(
        getOrSelectSubscriptionItemStub.calledOnce,
        true,
        'getOrSelectSubscriptionItem should be called');
      assert.strictEqual(getOrCreateResourceGroupItemStub.calledOnce, true, 'getOrCreateResourceGroupItem should be called');
      assert.strictEqual(showQuickPickStub.calledOnce, true, 'showQuickPick should be called');
      assert.strictEqual(
        getBlockchainDataManagerInstanceStub.calledOnce,
        true,
        'getBlockchainDataManagerInstance should be called');
      assert.strictEqual(
        getBlockchainDataManagerInstanceStub.args[0][0],
        bdmInstance1,
        'getBlockchainDataManagerInstance should be called with correct arguments');
    });

    it('selectProject should start creating blockchain data manager instance', async () => {
      // Arrange
      sinon.stub(blockchainDataManagerResourceExplorer.prototype, 'getAzureClient').returns(Promise.resolve());
      sinon.stub(blockchainDataManagerResourceExplorer.prototype, 'getBlockchainDataManagerInstanceItems').resolves([]);
      const createProjectStub = sinon.stub(blockchainDataManagerResourceExplorer.prototype, 'createProject');

      const showQuickPickStub = sinon.stub().returns({});
      sinon.replace(helpers, 'showQuickPick', showQuickPickStub);

      // Act
      await blockchainDataManagerResourceExplorer.prototype.selectProject();

      // Assert
      assert.strictEqual(
        getOrSelectSubscriptionItemStub.calledOnce,
        true,
        'getOrSelectSubscriptionItem should be called');
      assert.strictEqual(getOrCreateResourceGroupItemStub.calledOnce, true, 'getOrCreateResourceGroupItem should be called');
      assert.strictEqual(showQuickPickStub.calledOnce, true, 'showQuickPick should be called');
      assert.strictEqual(
        getBlockchainDataManagerInstanceStub.notCalled,
        true,
        'getBlockchainDataManagerInstance should not called');
      assert.strictEqual(createProjectStub.calledOnce, true, 'createProjectStub should called');
    });

    it('deleteBDMApplication should executed all methods for delete BDM application', async () => {
      // Arrange
      const azureExplorer = {
        bdmResource: { deleteBlockchainDataManagerApplication: async () => Promise.resolve() }};

      const deleteBlobsStub =
        sinon.stub(StorageAccountResourceExplorer.prototype, 'deleteBlobs').returns(Promise.resolve());
      const removeItemStub = sinon.stub(TreeManager, 'removeItem');
      const deleteBlockchainDataManagerApplicationSpy = sinon.spy(azureExplorer.bdmResource, 'deleteBlockchainDataManagerApplication');
      sinon.stub(ContractService, 'getBuildFolderPath');
      sinon.stub(blockchainDataManagerResourceExplorer.prototype, 'getAzureClient')
        .returns(Promise.resolve(azureExplorer));
      sinon.stub(blockchainDataManagerResourceExplorer.prototype, 'getSubscriptionItem').returns(Promise.resolve());

      const bdmLabel = uuid.v4();
      const fileUrls = [uuid.v4(), uuid.v4()];
      const subscriptionId = uuid.v4();
      const resourceGroup = uuid.v4();
      const application = new BlockchainDataManagerNetworkNode(
        uuid.v4(),
        uuid.v4(),
        subscriptionId,
        resourceGroup,
        fileUrls,
        ItemType.BLOCKCHAIN_DATA_MANAGER_APPLICATION,
        uuid.v4());

      // Act
      await blockchainDataManagerResourceExplorer.prototype
        .deleteBDMApplication(bdmLabel, application, new StorageAccountResourceExplorer());

      // Assert
      assert.strictEqual(deleteBlockchainDataManagerApplicationSpy.calledOnce, true, 'deleteBlockchainDataManagerApplication should be called');
      assert.strictEqual(removeItemStub.calledOnce, true, 'removeItem should be called');
      assert.strictEqual(deleteBlobsStub.calledOnce, true, 'deleteBlobs should be called');
      assert.strictEqual(deleteBlobsStub.calledOnce, true, 'deleteBlobs should be called');
    });

    describe('createNewBDMApplication', () => {
      let getSolidityContractsFolderPathStub: any;
      let getDeployedBytecodeByAddressStub: sinon.SinonStub<[string, string], Promise<string>>;
      let getBDMApplicationNameStub: sinon.SinonStub<any[], any>;
      let getBlobUrlsStub: sinon.SinonStub<any[], any>;
      let createBDMApplicationStub: sinon.SinonStub<any[], any> | sinon.SinonStub<unknown[], unknown>;

      beforeEach(() => {
        sinon.stub(fs, 'statSync').returns({ isDirectory: () => false} as fs.Stats);
        sinon.stub(vscode.window, 'showInformationMessage');
        getSolidityContractsFolderPathStub = sinon.stub(ContractService, 'getSolidityContractsFolderPath')
          .returns(Promise.resolve(''));
        getDeployedBytecodeByAddressStub = sinon.stub(ContractService, 'getDeployedBytecodeByAddress')
          .returns(Promise.resolve(uuid.v4()));
        getBDMApplicationNameStub = sinon.stub(blockchainDataManagerResourceExplorer.prototype, 'getBDMApplicationName')
          .returns(Promise.resolve(uuid.v4()));
        getBlobUrlsStub = sinon.stub(blockchainDataManagerResourceExplorer.prototype, 'getBlobUrls')
          .returns(Promise.resolve([uuid.v4(), uuid.v4()]));
        createBDMApplicationStub = sinon.stub(blockchainDataManagerResourceExplorer.prototype, 'createBDMApplication');
      });

      afterEach(() => {
        sinon.reset();
      });

      it('should executed all methods for delete BDM application', async () => {
        // Arrange
        const blockchainDataManagerProject = new BlockchainDataManagerProject(uuid.v4(), uuid.v4(), uuid.v4());
        const contractDirectory = ['File1.sol', 'File2.txt', 'File3.sol'];

        const testContractFilePath = path.join(__dirname, 'testData', 'enumTestContract.json');
        const fileData = fs.readFileSync(testContractFilePath, 'utf-8');
        const contract = new Contract(JSON.parse(fileData));
        contract.networks.testNetworkKey = { address: uuid.v4() };
        const instanceTest =
          new ContractInstanceWithMetadata(contract, { id: 'testNetworkKey' }, { host: uuid.v4()});

        const expectedSolFiles = 2;
        let countSolFiles = 0;

        sinon.stub(fs, 'readdirSync').returns(contractDirectory as any[]);
        sinon.stub(helpers, 'showQuickPick').callsFake((...args: any[]) => {
          countSolFiles = args.length;
          return args[0];
        });

        sinon.stub(ContractDB, 'getContractInstances').returns(Promise.resolve([instanceTest]));

        // Act
        await blockchainDataManagerResourceExplorer.prototype
          .createNewBDMApplication(blockchainDataManagerProject, new StorageAccountResourceExplorer());

        // Assert
        assert.strictEqual(getSolidityContractsFolderPathStub.calledOnce, true, 'getSolidityContractsFolderPath should be called');
        assert.strictEqual(countSolFiles, expectedSolFiles, 'showQuickPick should show only solidity files');
        assert.strictEqual(getDeployedBytecodeByAddressStub.calledOnce, true, 'getDeployedBytecodeByAddressStub should be called');
        assert.strictEqual(getBDMApplicationNameStub.calledOnce, true, 'getBDMApplicationName should be called');
        assert.strictEqual(getBlobUrlsStub.calledOnce, true, 'getBlobUrls should be called');
        assert.strictEqual(createBDMApplicationStub.calledOnce, true, 'createBDMApplication should be called');
      });

      it('throws error when contract directory does not have solidity files', async () => {
        // Arrange
        const blockchainDataManagerProject = new BlockchainDataManagerProject(uuid.v4(), uuid.v4(), uuid.v4());
        const contractDirectory = ['File1.txt', 'File2.txt', 'File3.txt'];

        sinon.stub(fs, 'readdirSync').returns(contractDirectory as any[]);
        sinon.stub(helpers, 'showQuickPick');
        sinon.stub(ContractDB, 'getContractInstances');

        try {
          // Act
          await blockchainDataManagerResourceExplorer.prototype
            .createNewBDMApplication(blockchainDataManagerProject, new StorageAccountResourceExplorer());
        } catch (error) {
          // Assert
          assert.strictEqual(error.message, Constants.errorMessageStrings.SolidityContractsNotFound, 'error should be specific');
          assert.strictEqual(getSolidityContractsFolderPathStub.calledOnce, true, 'getSolidityContractsFolderPath should be called');
          assert.strictEqual(getDeployedBytecodeByAddressStub.calledOnce, false, 'getDeployedBytecodeByAddressStub should not called');
          assert.strictEqual(getBDMApplicationNameStub.calledOnce, false, 'getBDMApplicationName should not called');
          assert.strictEqual(getBlobUrlsStub.calledOnce, false, 'getBlobUrls should not called');
          assert.strictEqual(createBDMApplicationStub.calledOnce, false, 'createBDMApplication should not called');
        }
      });

      it('throws error when contract does not have instance and not to deploy them', async () => {
        // Arrange
        const blockchainDataManagerProject = new BlockchainDataManagerProject(uuid.v4(), uuid.v4(), uuid.v4());
        const contractDirectory = ['File1.sol', 'File2.txt', 'File3.sol'];

        const expectedSolFiles = 2;
        let countSolFiles = 0;

        sinon.stub(fs, 'readdirSync').returns(contractDirectory as any[]);
        sinon.stub(helpers, 'showQuickPick').callsFake((...args: any[]) => {
          countSolFiles = args.length;
          return args[0];
        });

        sinon.stub(ContractDB, 'getContractInstances').returns(Promise.resolve([]));
        const deployContractsStub = sinon.stub(TruffleCommands, 'deployContracts');
        sinon.stub(vscode.window, 'showErrorMessage').callsFake((...args: any[]) => {
          return args[1];
        });

        try {
          // Act
          await blockchainDataManagerResourceExplorer.prototype
            .createNewBDMApplication(blockchainDataManagerProject, new StorageAccountResourceExplorer());
        } catch (error) {
          // Assert
          assert.strictEqual(error.name, CancellationEvent.name, 'error should be specific');
          assert.strictEqual(countSolFiles, expectedSolFiles, 'showQuickPick should show only solidity files');
          assert.strictEqual(getSolidityContractsFolderPathStub.calledOnce, true, 'getSolidityContractsFolderPath should be called');
          assert.strictEqual(deployContractsStub.calledOnce, true, 'deployContractsStub should be called');
          assert.strictEqual(getDeployedBytecodeByAddressStub.calledOnce, false, 'getDeployedBytecodeByAddressStub should not called');
          assert.strictEqual(getBDMApplicationNameStub.calledOnce, false, 'getBDMApplicationName should not called');
          assert.strictEqual(getBlobUrlsStub.calledOnce, false, 'getBlobUrls should not called');
          assert.strictEqual(createBDMApplicationStub.calledOnce, false, 'createBDMApplication should not called');
        }
      });

      it('throws error when contract does not have instance and deploy them', async () => {
        // Arrange
        const blockchainDataManagerProject = new BlockchainDataManagerProject(uuid.v4(), uuid.v4(), uuid.v4());
        const contractDirectory = ['File1.sol', 'File2.txt', 'File3.sol'];

        const expectedSolFiles = 2;
        let countSolFiles = 0;

        sinon.stub(fs, 'readdirSync').returns(contractDirectory as any[]);
        sinon.stub(helpers, 'showQuickPick').callsFake((...args: any[]) => {
          countSolFiles = args.length;
          return args[0];
        });

        sinon.stub(ContractDB, 'getContractInstances').returns(Promise.resolve([]));
        const deployContractsStub = sinon.stub(TruffleCommands, 'deployContracts');
        sinon.stub(vscode.window, 'showErrorMessage').callsFake((...args: any[]) => {
          return args[2];
        });

        try {
          // Act
          await blockchainDataManagerResourceExplorer.prototype
            .createNewBDMApplication(blockchainDataManagerProject, new StorageAccountResourceExplorer());
        } catch (error) {
          // Assert
          assert.strictEqual(error.name, CancellationEvent.name, 'error should be specific');
          assert.strictEqual(countSolFiles, expectedSolFiles, 'showQuickPick should show only solidity files');
          assert.strictEqual(getSolidityContractsFolderPathStub.calledOnce, true, 'getSolidityContractsFolderPath should be called');
          assert.strictEqual(deployContractsStub.calledOnce, false, 'deployContractsStub should not called');
          assert.strictEqual(getDeployedBytecodeByAddressStub.calledOnce, false, 'getDeployedBytecodeByAddressStub should not called');
          assert.strictEqual(getBDMApplicationNameStub.calledOnce, false, 'getBDMApplicationName should not called');
          assert.strictEqual(getBlobUrlsStub.calledOnce, false, 'getBlobUrls should not called');
          assert.strictEqual(createBDMApplicationStub.calledOnce, false, 'createBDMApplication should not called');
        }
      });

      it('throws error when contract instance does not have provider', async () => {
        // Arrange
        const blockchainDataManagerProject = new BlockchainDataManagerProject(uuid.v4(), uuid.v4(), uuid.v4());
        const contractDirectory = ['File1.sol', 'File2.txt', 'File3.sol'];

        const testContractFilePath = path.join(__dirname, 'testData', 'enumTestContract.json');
        const fileData = fs.readFileSync(testContractFilePath, 'utf-8');
        const contract = new Contract(JSON.parse(fileData));
        contract.networks.testNetworkKey = { address: uuid.v4() };
        const instanceTest =
          new ContractInstanceWithMetadata(contract, { id: 'testNetworkKey' }, null);

        const expectedSolFiles = 2;
        let countSolFiles = 0;

        sinon.stub(fs, 'readdirSync').returns(contractDirectory as any[]);
        sinon.stub(helpers, 'showQuickPick').callsFake((...args: any[]) => {
          countSolFiles = args.length;
          return args[0];
        });

        sinon.stub(ContractDB, 'getContractInstances').returns(Promise.resolve([instanceTest]));

        try {
          // Act
          await blockchainDataManagerResourceExplorer.prototype
            .createNewBDMApplication(blockchainDataManagerProject, new StorageAccountResourceExplorer());
        } catch (error) {
          // Assert
          assert.strictEqual(error.message, Constants.errorMessageStrings.NetworkIsNotAvailable, 'error should be specific');
          assert.strictEqual(countSolFiles, expectedSolFiles, 'showQuickPick should show only solidity files');
          assert.strictEqual(getSolidityContractsFolderPathStub.calledOnce, true, 'getSolidityContractsFolderPath should be called');
          assert.strictEqual(getDeployedBytecodeByAddressStub.calledOnce, false, 'getDeployedBytecodeByAddressStub should not called');
          assert.strictEqual(getBDMApplicationNameStub.calledOnce, false, 'getBDMApplicationName should not called');
          assert.strictEqual(getBlobUrlsStub.calledOnce, false, 'getBlobUrls should not called');
          assert.strictEqual(createBDMApplicationStub.calledOnce, false, 'createBDMApplication should not called');
        }
      });

      it('throws error when contract instance does not have address', async () => {
        // Arrange
        const blockchainDataManagerProject = new BlockchainDataManagerProject(uuid.v4(), uuid.v4(), uuid.v4());
        const contractDirectory = ['File1.sol', 'File2.txt', 'File3.sol'];

        const testContractFilePath = path.join(__dirname, 'testData', 'enumTestContract.json');
        const fileData = fs.readFileSync(testContractFilePath, 'utf-8');
        const contract = new Contract(JSON.parse(fileData));
        const instanceTest =
          new ContractInstanceWithMetadata(contract, { id: 'testNetworkKey' }, { host: uuid.v4()});

        const expectedSolFiles = 2;
        let countSolFiles = 0;

        sinon.stub(fs, 'readdirSync').returns(contractDirectory as any[]);
        sinon.stub(helpers, 'showQuickPick').callsFake((...args: any[]) => {
          countSolFiles = args.length;
          return args[0];
        });

        sinon.stub(ContractDB, 'getContractInstances').returns(Promise.resolve([instanceTest]));

        try {
          // Act
          await blockchainDataManagerResourceExplorer.prototype
            .createNewBDMApplication(blockchainDataManagerProject, new StorageAccountResourceExplorer());
        } catch (error) {
          // Assert
          assert.strictEqual(error.message, Constants.errorMessageStrings.NetworkIsNotAvailable, 'error should be specific');
          assert.strictEqual(countSolFiles, expectedSolFiles, 'showQuickPick should show only solidity files');
          assert.strictEqual(getSolidityContractsFolderPathStub.calledOnce, true, 'getSolidityContractsFolderPath should be called');
          assert.strictEqual(getDeployedBytecodeByAddressStub.calledOnce, false, 'getDeployedBytecodeByAddressStub should not called');
          assert.strictEqual(getBDMApplicationNameStub.calledOnce, false, 'getBDMApplicationName should not called');
          assert.strictEqual(getBlobUrlsStub.calledOnce, false, 'getBlobUrls should not called');
          assert.strictEqual(createBDMApplicationStub.calledOnce, false, 'createBDMApplication should not called');
        }
      });
    });

    describe('createProject', () => {
      const selectedMember = { label: uuid.v4() };
      const selectedEventGrid = new EventGridItem(uuid.v4(), uuid.v4());
      const transactionName = uuid.v4();
      let getSelectedMemberStub: any;
      let getSelectedTransactionNodeStub: any;
      let getSelectedEventGridStub: any;
      let createBlockchainDataManagerInstanceStub: any;
      let getEventGridClientStub: any;
      let consortiumResourceExplorer: any;

      beforeEach(() => {
        getEventGridClientStub = sinon.stub(blockchainDataManagerResourceExplorer.prototype, 'getEventGridClient');
        getSelectedMemberStub = sinon.stub(blockchainDataManagerResourceExplorer.prototype, 'getSelectedMember')
          .returns(Promise.resolve(selectedMember));
        getSelectedTransactionNodeStub = sinon.stub(blockchainDataManagerResourceExplorer.prototype, 'getSelectedTransactionNode')
          .returns(new TransactionNodeItem(transactionName, uuid.v4(), uuid.v4()));
        getSelectedEventGridStub = sinon.stub(blockchainDataManagerResourceExplorer.prototype, 'getSelectedEventGrid')
          .returns(selectedEventGrid);
        createBlockchainDataManagerInstanceStub =
          sinon.stub(blockchainDataManagerResourceExplorer.prototype, 'createBlockchainDataManagerInstance');
        consortiumResourceExplorer = { createAzureConsortium: () => Promise.resolve() };
      });

      it('all method should be executed for create Blockchain Data Manager', async () => {
        // Arrange
        const consortiaList = await getConsortiaList();
        const memberName = uuid.v4();
        const location = uuid.v4();
        const selectedConsortium =
          new ConsortiumItem(uuid.v4(), uuid.v4(), uuid.v4(), memberName, location, uuid.v4());
        const bdmList = await getBlockchainDataManagerList();
        const azureExplorer = {
          bdmResource: { getBlockchainDataManagerList: async () => bdmList },
          consortiumResource: { getConsortiaList: async () => consortiaList }};

        sinon.stub(blockchainDataManagerResourceExplorer.prototype, 'getAzureClient')
          .returns(Promise.resolve(azureExplorer));

        const getSelectedConsortiumStub =
          sinon.stub(blockchainDataManagerResourceExplorer.prototype, 'getSelectedConsortium')
            .returns(selectedConsortium);
        const getBlockchainDataManagerListSpy = sinon.spy(azureExplorer.bdmResource, 'getBlockchainDataManagerList');

        // Act
        await blockchainDataManagerResourceExplorer.prototype.createProject(consortiumResourceExplorer);

        // Assert
        assert.strictEqual(
          getOrSelectSubscriptionItemStub.calledOnce,
          true,
          'getOrSelectSubscriptionItem should be called');
        assert.strictEqual(getOrCreateResourceGroupItemStub.calledOnce, true, 'getOrCreateResourceGroupItem should be called');
        assert.strictEqual(getEventGridClientStub.calledOnce, true, 'getEventGridClient should be called');
        assert.strictEqual(getSelectedConsortiumStub.calledOnce, true, 'getSelectedConsortium should be called');
        assert.strictEqual(getSelectedMemberStub.calledOnce, true, 'getSelectedMember should be called');
        assert.strictEqual(getSelectedMemberStub.args[0][2], memberName, 'getSelectedMember should be called with special member name');
        assert.strictEqual(getBlockchainDataManagerListSpy.calledOnce, true, 'getBlockchainDataManagerList should be called');
        assert.strictEqual(getSelectedTransactionNodeStub.calledOnce, true, 'getSelectedTransactionNode should be called');
        assert.strictEqual(getSelectedTransactionNodeStub.args[0][1], bdmList, 'getSelectedTransactionNode should be called with special bdm list');
        assert.strictEqual(
          getSelectedTransactionNodeStub.args[0][2],
          selectedMember.label,
          'getSelectedTransactionNode should be called with special member name');
        assert.strictEqual(
          getSelectedTransactionNodeStub.args[0][3],
          location,
          'getSelectedTransactionNode should be called with special location');
        assert.strictEqual(getSelectedEventGridStub.calledOnce, true, 'getSelectedEventGrid should be called');
        assert.strictEqual(
          getSelectedEventGridStub.args[0][1],
          location,
          'getSelectedEventGrid should be called with special location');
        assert.strictEqual(createBlockchainDataManagerInstanceStub.calledOnce, true, 'createBlockchainDataManagerInstance should be called');
        assert.strictEqual(
          createBlockchainDataManagerInstanceStub.args[0][1],
          bdmList,
          'createBlockchainDataManagerInstanceStub should be called with special bdm list');
        assert.strictEqual(
          createBlockchainDataManagerInstanceStub.args[0][2],
          selectedConsortium.location,
          'createBlockchainDataManagerInstanceStub should be called with special location');
        assert.strictEqual(
          createBlockchainDataManagerInstanceStub.args[0][3],
          selectedMember.label,
          'createBlockchainDataManagerInstanceStub should be called with selected member');
        assert.strictEqual(
          createBlockchainDataManagerInstanceStub.args[0][5],
          selectedEventGrid.url,
          'createBlockchainDataManagerInstanceStub should be called with selected event grid');
      });

      it('should run the creation of a consortium', async () => {
        // Arrange
        const consortiaList = await getConsortiaList();
        const bdmList = await getBlockchainDataManagerList();
        const azureExplorer = {
          bdmResource: { getBlockchainDataManagerList: async () => bdmList },
          consortiumResource: { getConsortiaList: async () => consortiaList }};

        sinon.stub(blockchainDataManagerResourceExplorer.prototype, 'getAzureClient')
          .returns(Promise.resolve(azureExplorer));

        const getSelectedConsortiumStub =
          sinon.stub(blockchainDataManagerResourceExplorer.prototype, 'getSelectedConsortium').returns({});
        const createAzureConsortiumStub = sinon.stub(consortiumResourceExplorer, 'createAzureConsortium');
        const getBlockchainDataManagerListSpy = sinon.spy(azureExplorer.bdmResource, 'getBlockchainDataManagerList');
        const createConsortiumCallbackStub = sinon.stub();

        try {
          // Act
          await blockchainDataManagerResourceExplorer.prototype
            .createProject(consortiumResourceExplorer, createConsortiumCallbackStub);
        } catch (error) {
          assert.strictEqual(error.name, new CancellationEvent().name);
        } finally {
          // Assert
          assert.strictEqual(
            getOrSelectSubscriptionItemStub.calledOnce,
            true,
            'getOrSelectSubscriptionItem should be called');
          assert
            .strictEqual(createConsortiumCallbackStub.calledOnce, true, 'createConsortiumCallback should be called');
          assert.strictEqual(createAzureConsortiumStub.calledOnce, true, 'createAzureConsortium should be called');
          assert.strictEqual(getOrCreateResourceGroupItemStub.calledOnce, true, 'getOrCreateResourceGroupItem should be called');
          assert.strictEqual(getEventGridClientStub.calledOnce, true, 'getEventGridClient should be called');
          assert.strictEqual(getSelectedConsortiumStub.calledOnce, true, 'getSelectedConsortium should be called');
          assert.strictEqual(getSelectedMemberStub.notCalled, true, 'getSelectedMember should not called');
          assert.strictEqual(getBlockchainDataManagerListSpy.notCalled, true, 'getBlockchainDataManagerList should not called');
          assert.strictEqual(getSelectedTransactionNodeStub.notCalled, true, 'getSelectedTransactionNode should not called');
          assert.strictEqual(getSelectedEventGridStub.notCalled, true, 'getSelectedEventGrid should not called');
          assert.strictEqual(createBlockchainDataManagerInstanceStub.notCalled, true, 'createBlockchainDataManagerInstance should not called');
        }
      });
    });
  });

  describe('Private methods', () => {
    it('loadBlockchainDataManagerInstanceItems should return bdm instances', async () => {
      // Arrange
      const bdmList = await getBlockchainDataManagerList();
      const azureExplorer = {
        bdmResource: { getBlockchainDataManagerList: async () => bdmList }};
      const getBlockchainDataManagerListSpy = sinon.spy(azureExplorer.bdmResource, 'getBlockchainDataManagerList');

      // Act
      const result = await blockchainDataManagerResourceExplorer.prototype
        .loadBlockchainDataManagerInstanceItems(azureExplorer, [bdmList[0].name]);

      // Assert
      assert.strictEqual(result[0].bdmName, bdmList[1].name, 'result should has special bdm instance');
      assert.strictEqual(getBlockchainDataManagerListSpy.calledOnce, true, 'getBlockchainDataManagerList should be called');
    });

    it('getBlockchainDataManagerInstance should return bdm instance', async () => {
      // Arrange
      const { input, output } = Constants.treeItemData.group.bdm;
      const blockchainDataManagerInstanceItem =
        new BlockchainDataManagerInstanceItem(uuid.v4(), uuid.v4(), uuid.v4(), uuid.v4());

      const applicationList = await getBlockchainDataManagerApplicationList();
      const inputList = await getBlockchainDataManagerInputList();
      const outputList = await getBlockchainDataManagerOutputList();
      const azureExplorer = {
        bdmResource: {
          getBlockchainDataManagerApplicationList: async () => applicationList,
          getBlockchainDataManagerInputList: async () => inputList,
          getBlockchainDataManagerOutputList: async () => outputList,
        }};

      const getBlockchainDataManagerApplicationListSpy =
        sinon.spy(azureExplorer.bdmResource, 'getBlockchainDataManagerApplicationList');
      const getBlockchainDataManagerInputListSpy =
        sinon.spy(azureExplorer.bdmResource, 'getBlockchainDataManagerInputList');
      const getBlockchainDataManagerOutputListSpy =
        sinon.spy(azureExplorer.bdmResource, 'getBlockchainDataManagerOutputList');

      // Act
      const bdmProject = await blockchainDataManagerResourceExplorer.prototype
        .getBlockchainDataManagerInstance(blockchainDataManagerInstanceItem, azureExplorer);

      // Assert
      // We should remember that inputs and outputs are in groups, because of it we use + 2
      assert.strictEqual(
        bdmProject.children.length, applicationList.length + 2, 'result should has special number of children');
      assert.strictEqual(
        bdmProject.children
          .filter((ch: BlockchainDataManagerNetworkNode) => ch.label === input.label)[0].children.length,
        inputList.length,
        'Input group should has special number of inputs');
      assert.strictEqual(
        bdmProject.children
          .filter((ch: BlockchainDataManagerNetworkNode) => ch.label === output.label)[0].children.length,
        outputList.length,
        'Output group should has special number of outputs');
      assert.strictEqual(
        getBlockchainDataManagerApplicationListSpy.calledOnce,
        true,
        'getBlockchainDataManagerApplicationList should be called');
      assert.strictEqual(
        getBlockchainDataManagerInputListSpy.calledOnce, true, 'getBlockchainDataManagerInputList should be called');
      assert.strictEqual(
        getBlockchainDataManagerOutputListSpy.calledOnce, true, 'getBlockchainDataManagerOutputList should be called');
    });

    it('createBlockchainDataManagerInstance should return bdm instance', async () => {
      // Arrange
      const expectedNumberChildren = 2;
      const bdmItems = await getBlockchainDataManagerList();
      const transactionNodeName = uuid.v4();
      const selectedBdmName = uuid.v4();
      const connectionName = uuid.v4();

      const inputList = await getBlockchainDataManagerInputList();
      const outputList = await getBlockchainDataManagerOutputList();
      const azureExplorer = {
        bdmResource: {
          createBlockchainDataManager: async (_a: any, _b: any) => bdmItems[0],
          createBlockchainDataManagerInput: async (_a: any, _b: any, _c: any) => inputList[0],
          createBlockchainDataManagerOutput: async (_a: any, _b: any, _c: any) => outputList[0],
        }};

      const getBlockchainDataManagerConnectionNameStub =
        sinon.stub(blockchainDataManagerResourceExplorer.prototype, 'getBlockchainDataManagerConnectionName')
          .returns(Promise.resolve(connectionName));
      const getBlockchainDataManagerNameStub =
        sinon.stub(blockchainDataManagerResourceExplorer.prototype, 'getBlockchainDataManagerName')
          .returns(Promise.resolve(selectedBdmName));
      const createBlockchainDataManagerSpy = sinon.spy(azureExplorer.bdmResource, 'createBlockchainDataManager');
      const createBlockchainDataManagerInputSpy = sinon.spy(azureExplorer.bdmResource, 'createBlockchainDataManagerInput');
      const createBlockchainDataManagerOutputSpy = sinon.spy(azureExplorer.bdmResource, 'createBlockchainDataManagerOutput');
      const startBlockchainDataManagerStub =
        sinon.stub(blockchainDataManagerResourceExplorer.prototype, 'startBlockchainDataManager');

      const withProgressStub = sinon.stub(vscode.window, 'withProgress').callsFake((...args: any[]) => {
        return args[1]();
      });

      // Act
      const bdmProject = await blockchainDataManagerResourceExplorer.prototype.createBlockchainDataManagerInstance(
        azureExplorer,
        bdmItems,
        uuid.v4(),
        uuid.v4(),
        transactionNodeName,
        uuid.v4());

      // Assert
      assert.strictEqual(bdmProject.children.length, expectedNumberChildren, `result should has only ${expectedNumberChildren} children`);
      assert.strictEqual(
        getBlockchainDataManagerConnectionNameStub.calledOnce,
        true,
        'getBlockchainDataManagerConnectionName should be called');
      assert.strictEqual(
        getBlockchainDataManagerNameStub.calledOnce,  true, 'getBlockchainDataManagerName should be called');
      assert.strictEqual(withProgressStub.calledOnce, true, 'withProgress should be called');
      assert.strictEqual(
        createBlockchainDataManagerSpy.calledOnce, true, 'createBlockchainDataManager should be called');
      assert.strictEqual(
        createBlockchainDataManagerSpy.args[0][0],
        selectedBdmName,
        'createBlockchainDataManager should be called with special argument');
      assert.strictEqual(
        createBlockchainDataManagerInputSpy.calledOnce, true, 'createBlockchainDataManagerInput should be called');
      assert.strictEqual(createBlockchainDataManagerInputSpy.args[0][0],
        selectedBdmName,
        'createBlockchainDataManagerInput should be called with special bdm name');
      assert.strictEqual(createBlockchainDataManagerInputSpy.args[0][1],
        transactionNodeName,
        'createBlockchainDataManagerInput should be called with special transaction node name');
      assert.strictEqual(
        createBlockchainDataManagerOutputSpy.calledOnce, true, 'createBlockchainDataManagerOutput should be called');
      assert.strictEqual(createBlockchainDataManagerOutputSpy.args[0][0],
        selectedBdmName,
        'createBlockchainDataManagerOutput should be called with special bdm name');
      assert.strictEqual(createBlockchainDataManagerOutputSpy.args[0][1],
        connectionName,
        'createBlockchainDataManagerOutput should be called with special connection name');
      assert.strictEqual(
        startBlockchainDataManagerStub.calledOnce, true, 'startBlockchainDataManager should be called');
      assert.strictEqual(startBlockchainDataManagerStub.args[0][1],
        bdmItems[0].id,
        'startBlockchainDataManager should be called with selected bdm url');
      assert.strictEqual(startBlockchainDataManagerStub.args[0][2],
        selectedBdmName,
        'startBlockchainDataManager should be called with selected bdm name');

      assert.strictEqual(
        createBlockchainDataManagerInputSpy.calledAfter(createBlockchainDataManagerSpy),
        true,
        'createBlockchainDataManagerInput should be called after createBlockchainDataManager');
      assert.strictEqual(
        createBlockchainDataManagerOutputSpy.calledAfter(createBlockchainDataManagerInputSpy),
        true,
        'createBlockchainDataManagerOutput should be called after createBlockchainDataManagerInput');
      assert.strictEqual(
        startBlockchainDataManagerStub.calledAfter(createBlockchainDataManagerOutputSpy),
        true,
        'startBlockchainDataManager should be called after createBlockchainDataManagerOutput');
    });

    describe('getBlockchainDataManagerConnectionName', () => {
      describe('should return error when connection name does not correct', () => {
        const incorrectConnectionName = ['', 'A', 'a_a'];
        incorrectConnectionName.forEach((name) => {
          it(`and equal ${name}`, async () => {
            // Arrange
            sinon.stub(helpers, 'showInputBox').callsFake((...args: any[]) => {
              return args[0].validateInput(name);
            });

            // Act
            const result = await blockchainDataManagerResourceExplorer.prototype
              .getBlockchainDataManagerConnectionName();

            // Assert
            assert.strictEqual(result, Constants.validationMessages.forbiddenChars.outboundConnectionName, 'result should has error');
          });
        });
      });

      describe('should not returns error when connection name correct', () => {
        const correctConnectionName = ['1', 'a', '1a'];
        correctConnectionName.forEach((name) => {
          it(`and equal ${name}`, async () => {
            // Arrange
            sinon.stub(helpers, 'showInputBox').callsFake((...args: any[]) => {
              return args[0].validateInput(name);
            });

            // Act
            const result = await blockchainDataManagerResourceExplorer.prototype
              .getBlockchainDataManagerConnectionName();

            // Assert
            assert.strictEqual(result, undefined, 'result should not has error');
          });
        });
      });
    });

    describe('getBlockchainDataManagerName', () => {
      describe('should return error when bdm name does not correct', () => {
        const incorrectConnectionName = ['', 'A', '!', 'aaaaaaaaaaaaaaaaaaaa1', 'a_1'];
        incorrectConnectionName.forEach((name) => {
          it(`and equal ${name}`, async () => {
            // Arrange
            const bdmItems = await getBlockchainDataManagerList();
            sinon.stub(helpers, 'showInputBox').callsFake((...args: any[]) => {
              return args[0].validateInput(name);
            });

            // Act
            const result = await blockchainDataManagerResourceExplorer.prototype
              .getBlockchainDataManagerName(bdmItems);

            // Assert
            assert.strictEqual(result, Constants.validationMessages.invalidBlockchainDataManagerName, 'result should has error');
          });
        });
      });

      it('should return error when bdm name already exist', async () => {
        // Arrange
        const bdmItems = await getBlockchainDataManagerList();
        sinon.stub(helpers, 'showInputBox').callsFake((...args: any[]) => {
          return args[0].validateInput(bdmItems[0].name);
        });

        // Act
        const result = await blockchainDataManagerResourceExplorer.prototype
          .getBlockchainDataManagerName(bdmItems);

        // Assert
        assert.strictEqual(result, Constants.validationMessages.bdmNameAlreadyExists, 'result should has error');
      });

      describe('should not returns error when bdm name correct', () => {
        const correctConnectionName = ['1', 'a', '1a', 'aaaaaaaaaa1111111111'];
        correctConnectionName.forEach((name) => {
          it(`and equal ${name}`, async () => {
            // Arrange
            const bdmItems = await getBlockchainDataManagerList();
            sinon.stub(helpers, 'showInputBox').callsFake((...args: any[]) => {
              return args[0].validateInput(name);
            });

            // Act
            const result = await blockchainDataManagerResourceExplorer.prototype
              .getBlockchainDataManagerName(bdmItems);

            // Assert
            assert.strictEqual(result, undefined, 'result should not has error');
          });
        });
      });
    });

    describe('getTransactionNodeName', () => {
      let transactionNodeItems: TransactionNodeItem[];

      beforeEach(() => {
        transactionNodeItems = [
          new TransactionNodeItem('transactionnode1', uuid.v4(), uuid.v4()),
          new TransactionNodeItem('transactionnode2', uuid.v4(), uuid.v4()),
        ];
      });

      describe('should return error when transaction node name does not correct', () => {
        const incorrectConnectionName = ['', 'a', 'aA', 'aaaaaaaaaaaaaaaaaaaa1', 'a_1', '1a'];
        incorrectConnectionName.forEach((name) => {
          it(`and equal ${name}`, async () => {
            // Arrange
            sinon.stub(helpers, 'showInputBox').callsFake((...args: any[]) => {
              return args[0].validateInput(name);
            });

            // Act
            const result = await blockchainDataManagerResourceExplorer.prototype
              .getTransactionNodeName(transactionNodeItems);

            // Assert
            assert.strictEqual(result, Constants.validationMessages.invalidAzureName, 'result should has error');
          });
        });
      });

      it('should return error when transaction node name already exist', async () => {
        // Arrange
        sinon.stub(helpers, 'showInputBox').callsFake((...args: any[]) => {
          return args[0].validateInput(transactionNodeItems[0].label);
        });

        // Act
        const result = await blockchainDataManagerResourceExplorer.prototype
          .getTransactionNodeName(transactionNodeItems);

        // Assert
        assert.strictEqual(result, Constants.validationMessages.transactionNodeNameAlreadyExists, 'result should has error');
      });

      describe('should not returns error when transaction node name correct', () => {
        const correctConnectionName = ['aa', 'a1', 'aaaaaaaaaa1111111111'];
        correctConnectionName.forEach((name) => {
          it(`and equal ${name}`, async () => {
            // Arrange
            sinon.stub(helpers, 'showInputBox').callsFake((...args: any[]) => {
              return args[0].validateInput(name);
            });

            // Act
            const result = await blockchainDataManagerResourceExplorer.prototype
              .getTransactionNodeName(transactionNodeItems);

            // Assert
            assert.strictEqual(result, undefined, 'result should not has error');
          });
        });
      });
    });

    describe('getEventGridName', () => {
      let eventGridItems: EventGridItem[];

      beforeEach(() => {
        eventGridItems = [
          new EventGridItem('eventgrid1', uuid.v4()),
          new EventGridItem('eventgrid2', uuid.v4()),
        ];
      });

      describe('should return error when event grid name does not correct', () => {
        const incorrectConnectionName = ['', 'aa', 'aA', 'aaaaaaaaaa1111111111aaaaaaaaaa1111111111aaaaaaaaaa1', 'a_1'];
        incorrectConnectionName.forEach((name) => {
          it(`and equal ${name}`, async () => {
            // Arrange
            sinon.stub(helpers, 'showInputBox').callsFake((...args: any[]) => {
              return args[0].validateInput(name);
            });

            // Act
            const result = await blockchainDataManagerResourceExplorer.prototype
              .getEventGridName(eventGridItems);

            // Assert
            assert.strictEqual(result, Constants.validationMessages.invalidEventGridName, 'result should has error');
          });
        });
      });

      it('should return error when event grid name already exist', async () => {
        // Arrange
        sinon.stub(helpers, 'showInputBox').callsFake((...args: any[]) => {
          return args[0].validateInput(eventGridItems[0].label);
        });

        // Act
        const result = await blockchainDataManagerResourceExplorer.prototype
          .getEventGridName(eventGridItems);

        // Assert
        assert.strictEqual(result, Constants.validationMessages.eventGridAlreadyExists, 'result should has error');
      });

      describe('should not returns error when event grid name correct', () => {
        const correctConnectionName =
          ['aaa', '111', 'AAA', 'aA-1', 'aaaaaaaaaa1111111111aaaaaaaaaa1111111111aaaaaaaaaa'];
        correctConnectionName.forEach((name) => {
          it(`and equal ${name}`, async () => {
            // Arrange
            sinon.stub(helpers, 'showInputBox').callsFake((...args: any[]) => {
              return args[0].validateInput(name);
            });

            // Act
            const result = await blockchainDataManagerResourceExplorer.prototype
              .getEventGridName(eventGridItems);

            // Assert
            assert.strictEqual(result, undefined, 'result should not has error');
          });
        });
      });
    });

    describe('getSelectedConsortium', () => {
      const azureExplorer = {};
      const consortiaItemList = getConsortiaItemList();

      it('should return quick pick with available consortia', async () => {
        // Arrange
        const consortiumResourceExplorer = {
          loadConsortiumItems: async () => consortiaItemList,
        };
        let numberQuickPickItems = 0;
        const loadConsortiumItemsSpy = sinon.spy(consortiumResourceExplorer, 'loadConsortiumItems');
        sinon.stub(helpers, 'showQuickPick').callsFake((...args: any[]) => {
          numberQuickPickItems = args[0].length;
          return args[0];
        });

        const expectedNumberConsortia = consortiaItemList
          .filter((con) => Constants.availableBlockchainDataManagerLocations.includes(con.location))
          .length;

        // Act
        await blockchainDataManagerResourceExplorer.prototype
          .getSelectedConsortium(consortiumResourceExplorer, azureExplorer);

        // Assert
        assert.strictEqual(loadConsortiumItemsSpy.calledOnce, true, 'loadConsortiumItems should be called');
        assert.strictEqual(numberQuickPickItems, expectedNumberConsortia, `QuickPick should has ${expectedNumberConsortia} consortia item`);
      });

      it('should return quick pick with add button', async () => {
        // Arrange
        const consortiumResourceExplorer = {
          loadConsortiumItems: async () => consortiaItemList
            .filter((con) => !Constants.availableBlockchainDataManagerLocations.includes(con.location)),
        };
        const expectedItem = { label: ''};
        const loadConsortiumItemsSpy = sinon.spy(consortiumResourceExplorer, 'loadConsortiumItems');
        sinon.stub(helpers, 'showQuickPick').callsFake((...args: any[]) => {
          expectedItem.label = args[0][0].label;
          return args[0];
        });

        // Act
        await blockchainDataManagerResourceExplorer.prototype
          .getSelectedConsortium(consortiumResourceExplorer, azureExplorer);

        // Assert
        assert.strictEqual(loadConsortiumItemsSpy.calledOnce, true, 'loadConsortiumItems should be called');
        assert.strictEqual(expectedItem.label, Constants.uiCommandStrings.createConsortium, 'QuickPick should has add button item');
      });
    });

    describe('getSelectedTransactionNode', () => {
      const selectedMemberName = uuid.v4();
      const location = uuid.v4();
      let bdmInputList: IAzureBlockchainDataManagerInputDto[];
      let bdmItems: IAzureBlockchainDataManagerDto[];
      let transactionNodeList: IAzureTransactionNodeDto[];
      let withProgressStub: any;
      let azureExplorer: any;
      let expectedQuickPickItems: number;
      let getBlockchainDataManagerInputListSpy: sinon.SinonSpy;
      let getTransactionNodeListSpy: sinon.SinonSpy;
      let getTransactionNodeSpy: sinon.SinonSpy;

      beforeEach(() => {
        bdmInputList = getBlockchainDataManagerInputList();
        bdmItems = getBlockchainDataManagerList();
        transactionNodeList = getTransactionNodeList();

        withProgressStub = sinon.stub(vscode.window, 'withProgress').callsFake((...args: any[]) => {
          return args[1]();
        });

        let changeOneTransactionNode = false;
        transactionNodeList.forEach((tn) => {
          if (tn.properties.provisioningState === Constants.provisioningState.succeeded && !changeOneTransactionNode) {
            tn.id = bdmInputList[0].properties.dataSource.resourceId;
            changeOneTransactionNode = true;
          }
        });

        // We should remember about default transaction node and create button, because of it we use + 2
        expectedQuickPickItems = transactionNodeList
          .filter((tn) => tn.properties.provisioningState === Constants.provisioningState.succeeded &&
            !bdmInputList.some((input) => input.properties.dataSource.resourceId === tn.id)).length + 2;

        azureExplorer = {
          bdmResource: {
            getBlockchainDataManagerInputList: async () => bdmInputList,
          },
          transactionNodeResource: {
            getTransactionNode: async (_a: any, _b: any) => ({
              id: uuid.v4(),
              location: uuid.v4(),
              name: uuid.v4(),
              properties: {
                dns: uuid.v4(),
                password: uuid.v4(),
                provisioningState: Constants.provisioningState.succeeded,
                publicKey: uuid.v4(),
                userName: uuid.v4(),
              },
              type: uuid.v4(),
            }),
            getTransactionNodeList: async (_a: any) => transactionNodeList,
          },
        };

        getBlockchainDataManagerInputListSpy
          = sinon.spy(azureExplorer.bdmResource, 'getBlockchainDataManagerInputList');
        getTransactionNodeListSpy = sinon.spy(azureExplorer.transactionNodeResource, 'getTransactionNodeList');
        getTransactionNodeSpy = sinon.spy(azureExplorer.transactionNodeResource, 'getTransactionNode');
      });

      function assertResponse(numberQuickPickItems: number) {
        assert.strictEqual(withProgressStub.calledOnce, true, 'withProgress should be called');
        assert.strictEqual(
          expectedQuickPickItems,
          numberQuickPickItems,
          'Quick pick should not has unsuccessful transaction node and transaction node which already use in bdm.');
        assert.strictEqual(
          getBlockchainDataManagerInputListSpy.callCount,
          bdmItems.length,
          `getBlockchainDataManagerInputList should be called ${bdmItems.length} time`);
        assert.strictEqual(getTransactionNodeListSpy.calledOnce, true, 'getTransactionNodeList should be called');
        assert.strictEqual(
          getTransactionNodeListSpy.args[0][0],
          selectedMemberName,
          'getTransactionNodeList should be called with selected member');
        assert.strictEqual(getTransactionNodeSpy.calledOnce, true, 'getTransactionNode should be called');
        assert.strictEqual(
          getTransactionNodeSpy.args[0][0],
          selectedMemberName,
          'getTransactionNode should be called with selected member');
        assert.strictEqual(
          getTransactionNodeSpy.args[0][1],
          Constants.defaultInputNameInBdm,
          'getTransactionNode should be called with default input name');
      }

      it('should return selected transaction node', async () => {
        // Arrange
        let numberQuickPickItems = 0;

        sinon.stub(helpers, 'showQuickPick').callsFake((...args: any[]) => {
          numberQuickPickItems = args[0].length;
          return args[0][1];
        });

        const createdTransactionNodeStub = sinon.stub(blockchainDataManagerResourceExplorer.prototype, 'createdTransactionNode');

        // Act
        await blockchainDataManagerResourceExplorer.prototype
          .getSelectedTransactionNode(azureExplorer, bdmItems, selectedMemberName, location);

        // Assert
        assertResponse(numberQuickPickItems);
        assert.strictEqual(createdTransactionNodeStub.notCalled, true, 'createdTransactionNode should not called');
      });

      it('should return cancellation event when quick pick return create button', async () => {
        // Arrange
        let numberQuickPickItems = 0;

        sinon.stub(helpers, 'showQuickPick').callsFake((...args: any[]) => {
          numberQuickPickItems = args[0].length;
          return args[0][0];
        });

        const createdTransactionNodeStub = sinon.stub(blockchainDataManagerResourceExplorer.prototype, 'createdTransactionNode');

        try {
          // Act
          await blockchainDataManagerResourceExplorer.prototype
          .getSelectedTransactionNode(azureExplorer, bdmItems, selectedMemberName, location);
        } catch (error) {
          assert.strictEqual(error.name, new CancellationEvent().name);
        } finally {
          // Assert
          assertResponse(numberQuickPickItems);
          assert.strictEqual(createdTransactionNodeStub.calledOnce, true, 'createdTransactionNode should be called');
        }
      });
    });

    describe('getSelectedEventGrid', () => {
      let getCreatedEventGridStub: sinon.SinonStub;
      let getEventGridListSpy: sinon.SinonSpy;
      let expectedQuickPickItems: number;
      let eventGridClient: any;

      beforeEach(() => {
        sinon.stub(vscode.extensions, 'getExtension').returns(AzureAccountHelper.mockExtension);
        sinon.stub(blockchainDataManagerResourceExplorer.prototype, 'waitForLogin').returns(Promise.resolve(true));
        const eventGridList = getEventGridList();

        eventGridClient = {
          eventGridResource: {
            getEventGridList: async () => eventGridList,
          },
        };

        getCreatedEventGridStub = sinon.stub(blockchainDataManagerResourceExplorer.prototype, 'getCreatedEventGrid');
        getEventGridListSpy = sinon.spy(eventGridClient.eventGridResource, 'getEventGridList');

        // We should remember about default create button, because of it we use + 1
        expectedQuickPickItems = eventGridList
          .filter((eg) => eg.properties.provisioningState === Constants.provisioningState.succeeded)
          .length + 1;
      });

      it('should return quick pick with available event grid', async () => {
        // Arrange
        let numberQuickPickItems = 0;
        sinon.stub(helpers, 'showQuickPick').callsFake((...args: any[]) => {
          numberQuickPickItems = args[0].length;
          return args[0][1];
        });

        // Act
        await blockchainDataManagerResourceExplorer.prototype.getSelectedEventGrid(eventGridClient, uuid.v4());

        // Assert
        assert.strictEqual(getEventGridListSpy.calledOnce, true, 'getEventGridList should be called');
        assert.strictEqual(
          numberQuickPickItems,
          expectedQuickPickItems,
          'Quick pick should not has unsuccessful event grid items');
        assert.strictEqual(getCreatedEventGridStub.notCalled, true, 'getCreatedEventGrid should not called');
      });

      it('should return cancellation event when quick pick return create button', async () => {
        // Arrange
        let numberQuickPickItems = 0;
        sinon.stub(helpers, 'showQuickPick').callsFake((...args: any[]) => {
          numberQuickPickItems = args[0].length;
          return args[0][0];
        });

        try {
          // Act
          await blockchainDataManagerResourceExplorer.prototype.getSelectedEventGrid(eventGridClient, uuid.v4());
        } catch (error) {
          assert.strictEqual(error.name, new CancellationEvent().name);
        } finally {
          // Assert
          assert.strictEqual(getEventGridListSpy.calledOnce, true, 'getEventGridList should be called');
          assert.strictEqual(
            numberQuickPickItems,
            expectedQuickPickItems,
            'Quick pick should not has unsuccessful event grid items');
          assert.strictEqual(getCreatedEventGridStub.calledOnce, true, 'getCreatedEventGrid should be called');
        }
      });
    });
  });

  const consortiumNameList = {
    consortium1: 'consortium1',
    consortium2: 'consortium2',
    consortium3: 'consortium3',
  };

  function getConsortiaList(): IAzureConsortiumDto[] {
    return [{
      consortium: consortiumNameList.consortium1,
      consortiumManagementAccountAddress: uuid.v4(),
      consortiumManagementAccountPassword: uuid.v4(),
      dns: uuid.v4(),
      location: 'eastus',
      password: uuid.v4(),
      protocol: uuid.v4(),
      provisioningState: uuid.v4(),
      publicKey: uuid.v4(),
      rootContractAddress: uuid.v4(),
      userName: uuid.v4(),
      validatorNodesSku: {
        capacity: 0,
      },
    },
    {
      consortium: consortiumNameList.consortium2,
      consortiumManagementAccountAddress: uuid.v4(),
      consortiumManagementAccountPassword: uuid.v4(),
      dns: uuid.v4(),
      location: 'westeurope',
      password: uuid.v4(),
      protocol: uuid.v4(),
      provisioningState: uuid.v4(),
      publicKey: uuid.v4(),
      rootContractAddress: uuid.v4(),
      userName: uuid.v4(),
      validatorNodesSku: {
        capacity: 0,
      },
    },
    {
      consortium: consortiumNameList.consortium3,
      consortiumManagementAccountAddress: uuid.v4(),
      consortiumManagementAccountPassword: uuid.v4(),
      dns: uuid.v4(),
      location: uuid.v4(),
      password: uuid.v4(),
      protocol: uuid.v4(),
      provisioningState: uuid.v4(),
      publicKey: uuid.v4(),
      rootContractAddress: uuid.v4(),
      userName: uuid.v4(),
      validatorNodesSku: {
        capacity: 0,
      },
    }];
  }

  const bdmNameList = {
    bdm1: 'bdm1',
    bdm2: 'bdm2',
  };

  function getBlockchainDataManagerList(): IAzureBlockchainDataManagerDto[] {
    return [{
      id: uuid.v4(),
      location: uuid.v4(),
      name: bdmNameList.bdm1,
      properties: {
        createdTime: uuid.v4(),
        lastUpdatedTime: uuid.v4(),
        provisioningState: uuid.v4(),
        sku: {
          locations: [uuid.v4()],
          name: uuid.v4(),
          resourceType: uuid.v4(),
          tier: uuid.v4(),
        },
        state: uuid.v4(),
        uniqueId: uuid.v4(),
      },
      tags: {},
      type: uuid.v4(),
    },
    {
      id: uuid.v4(),
      location: uuid.v4(),
      name: bdmNameList.bdm2,
      properties: {
        createdTime: uuid.v4(),
        lastUpdatedTime: uuid.v4(),
        provisioningState: uuid.v4(),
        sku: {
          locations: [uuid.v4()],
          name: uuid.v4(),
          resourceType: uuid.v4(),
          tier: uuid.v4(),
        },
        state: uuid.v4(),
        uniqueId: uuid.v4(),
      },
      tags: {},
      type: uuid.v4(),
    }];
  }

  function getBlockchainDataManagerInputList(): IAzureBlockchainDataManagerInputDto[] {
    return [{
      id: uuid.v4(),
      name: uuid.v4(),
      properties: {
        dataSource: {
          resourceId: uuid.v4(),
        },
        inputType: uuid.v4(),
      },
      type: uuid.v4(),
    },
    {
      id: uuid.v4(),
      name: uuid.v4(),
      properties: {
        dataSource: {
          resourceId: uuid.v4(),
        },
        inputType: uuid.v4(),
      },
      type: uuid.v4(),
    }];
  }

  function getBlockchainDataManagerOutputList(): IAzureBlockchainDataManagerOutputDto[] {
    return [{
      id: uuid.v4(),
      name: uuid.v4(),
      properties: {
        createdTime: uuid.v4(),
        dataSource: {
          resourceId: uuid.v4(),
        },
        lastUpdatedTime: uuid.v4(),
        outputType: uuid.v4(),
        state: uuid.v4(),
      },
      type: uuid.v4(),
    },
    {
      id: uuid.v4(),
      name: uuid.v4(),
      properties: {
        createdTime: uuid.v4(),
        dataSource: {
          resourceId: uuid.v4(),
        },
        lastUpdatedTime: uuid.v4(),
        outputType: uuid.v4(),
        state: uuid.v4(),
      },
      type: uuid.v4(),
    }];
  }

  function getBlockchainDataManagerApplicationList(): IAzureBlockchainDataManagerApplicationDto[] {
    return [
      {
        id: uuid.v4(),
        name: uuid.v4(),
        properties: {
          artifactType: uuid.v4(),
          content: {
            abiFileUrl: uuid.v4(),
            bytecodeFileUrl: uuid.v4(),
            queryTargetTypes: [uuid.v4()],
          },
          createdTime: uuid.v4(),
          lastUpdatedTime: uuid.v4(),
          provisioningState: uuid.v4(),
          state: uuid.v4(),
        },
        type: uuid.v4(),
      },
      {
        id: uuid.v4(),
        name: uuid.v4(),
        properties: {
          artifactType: uuid.v4(),
          content: {
            abiFileUrl: uuid.v4(),
            bytecodeFileUrl: uuid.v4(),
            queryTargetTypes: [uuid.v4()],
          },
          createdTime: uuid.v4(),
          lastUpdatedTime: uuid.v4(),
          provisioningState: uuid.v4(),
          state: uuid.v4(),
        },
        type: uuid.v4(),
      },
    ];
  }

  function getConsortiaItemList(): ConsortiumItem[] {
    return [
      new ConsortiumItem(uuid.v4(), uuid.v4(), uuid.v4(), uuid.v4(), 'eastus', uuid.v4()),
      new ConsortiumItem(uuid.v4(), uuid.v4(), uuid.v4(), uuid.v4(), 'westeurope', uuid.v4()),
      new ConsortiumItem(uuid.v4(), uuid.v4(), uuid.v4(), uuid.v4(), uuid.v4(), uuid.v4()),
      new ConsortiumItem(uuid.v4(), uuid.v4(), uuid.v4(), uuid.v4(), uuid.v4(), uuid.v4()),
    ];
  }

  function getTransactionNodeList(): IAzureTransactionNodeDto[] {
    return [
      {
        id: uuid.v4(),
        location: uuid.v4(),
        name: uuid.v4(),
        properties: {
          dns: uuid.v4(),
          password: uuid.v4(),
          provisioningState: uuid.v4(),
          publicKey: uuid.v4(),
          userName: uuid.v4(),
        },
        type: uuid.v4(),
      },
      {
        id: uuid.v4(),
        location: uuid.v4(),
        name: uuid.v4(),
        properties: {
          dns: uuid.v4(),
          password: uuid.v4(),
          provisioningState: Constants.provisioningState.succeeded,
          publicKey: uuid.v4(),
          userName: uuid.v4(),
        },
        type: uuid.v4(),
      },
      {
        id: uuid.v4(),
        location: uuid.v4(),
        name: uuid.v4(),
        properties: {
          dns: uuid.v4(),
          password: uuid.v4(),
          provisioningState: Constants.provisioningState.succeeded,
          publicKey: uuid.v4(),
          userName: uuid.v4(),
        },
        type: uuid.v4(),
      },
    ];
  }

  function getEventGridList(): IEventGridDto[] {
    return [
      {
        id: uuid.v4(),
        location: uuid.v4(),
        name: uuid.v4(),
        properties: {
          endpoint: uuid.v4(),
          inputSchema: uuid.v4(),
          metricResourceId: uuid.v4(),
          provisioningState: uuid.v4(),
        },
        tags: uuid.v4(),
        type: uuid.v4(),
      },
      {
        id: uuid.v4(),
        location: uuid.v4(),
        name: uuid.v4(),
        properties: {
          endpoint: uuid.v4(),
          inputSchema: uuid.v4(),
          metricResourceId: uuid.v4(),
          provisioningState: Constants.provisioningState.succeeded,
        },
        tags: uuid.v4(),
        type: uuid.v4(),
      },
      {
        id: uuid.v4(),
        location: uuid.v4(),
        name: uuid.v4(),
        properties: {
          endpoint: uuid.v4(),
          inputSchema: uuid.v4(),
          metricResourceId: uuid.v4(),
          provisioningState: Constants.provisioningState.succeeded,
        },
        tags: uuid.v4(),
        type: uuid.v4(),
      },
    ];
  }
});
