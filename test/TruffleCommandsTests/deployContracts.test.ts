// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import assert from "assert";
import fs from "fs";
import path from "path";
import sinon from "sinon";
import uuid from "uuid";
import vscode from "vscode";
import {TruffleCommands} from "../../src/commands/TruffleCommands";
import {Constants} from "../../src/Constants";
import * as helpers from "../../src/helpers";
import {TruffleConfiguration} from "../../src/helpers";
import * as commands from "../../src/helpers/command";
import {CancellationEvent, ItemType} from "../../src/Models";
import {
  AzureBlockchainNetworkNode,
  AzureBlockchainProject,
  AzureBlockchainService,
  BlockchainDataManagerNetworkNode,
  BlockchainDataManagerProject,
  BlockchainDataManagerService,
  IExtensionItem,
  InfuraNetworkNode,
  InfuraProject,
  InfuraService,
  LocalNetworkNode,
  LocalProject,
  LocalService,
  Member,
  Service,
} from "../../src/Models/TreeItems";
import {ConsortiumResourceExplorer} from "../../src/resourceExplorers";
import {GanacheService, MnemonicRepository, TreeManager} from "../../src/services";
import {TestConstants} from "../TestConstants";
import {AzureAccountHelper} from "../testHelpers/AzureAccountHelper";
const {service} = Constants.treeItemData;

describe("TruffleCommands", () => {
  describe("Integration test", async () => {
    describe("deployContracts", () => {
      let requiredMock: sinon.SinonMock;
      let checkAppsSilentMock: sinon.SinonExpectation;
      let installTruffleMock: sinon.SinonExpectation;
      let isHdWalletProviderRequiredMock: sinon.SinonExpectation;
      let checkHdWalletProviderVersionMock: sinon.SinonExpectation;
      let installTruffleHdWalletProviderMock: sinon.SinonExpectation;

      let getWorkspaceRootMock: any;

      let windowMock: sinon.SinonMock;
      let showQuickPickMock: any;
      let showInputBoxMock: any;
      let showSaveDialogMock: sinon.SinonExpectation;
      let showInformationMessageMock: any;

      let ganacheServiceMock: sinon.SinonMock;
      let startGanacheServerMock: sinon.SinonExpectation;

      let getItemsMock: sinon.SinonStub<[], IExtensionItem[]>;
      let loadStateMock: sinon.SinonStub<[], IExtensionItem[]>;
      let servicesItems: Service[];

      let truffleConfigSetNetworkMock: any;
      let truffleConfigGetNetworkMock: any;
      let truffleConfigGenerateMnemonicMock: any;

      let commandContextMock: sinon.SinonMock;
      let executeCommandMock: sinon.SinonExpectation;

      let mnemonicRepositoryMock: sinon.SinonMock;
      let getMnemonicMock: sinon.SinonStub<any[], any>;
      let getAllMnemonicPathsMock: sinon.SinonStub<any[], any>;
      let saveMnemonicPathMock: sinon.SinonExpectation;

      let writeFileSyncMock: any;

      let getAccessKeysMock: any;

      let getExtensionMock: any;

      beforeEach(async () => {
        getWorkspaceRootMock = sinon.stub(helpers, "getWorkspaceRoot");

        requiredMock = sinon.mock(helpers.required);
        checkAppsSilentMock = requiredMock.expects("checkAppsSilent");
        installTruffleMock = requiredMock.expects("installTruffle");
        isHdWalletProviderRequiredMock = requiredMock.expects("isHdWalletProviderRequired");
        checkHdWalletProviderVersionMock = requiredMock.expects("checkHdWalletProviderVersion");
        installTruffleHdWalletProviderMock = requiredMock.expects("installTruffleHdWalletProvider");
        isHdWalletProviderRequiredMock.returns(false);
        checkHdWalletProviderVersionMock.returns(false);

        windowMock = sinon.mock(vscode.window);
        showQuickPickMock = sinon.stub(vscode.window, "showQuickPick");
        showInputBoxMock = sinon.stub(vscode.window, "showInputBox");
        showSaveDialogMock = windowMock.expects("showSaveDialog");
        sinon.stub(vscode.window, "showErrorMessage");
        showInformationMessageMock = sinon.stub(vscode.window, "showInformationMessage");

        ganacheServiceMock = sinon.mock(GanacheService);
        startGanacheServerMock = ganacheServiceMock.expects("startGanacheServer");

        getItemsMock = sinon.stub(TreeManager, "getItems");
        loadStateMock = sinon.stub(TreeManager, "loadState");
        servicesItems = await createTestServicesItems();
        getItemsMock.returns(servicesItems);
        loadStateMock.returns(servicesItems);

        truffleConfigSetNetworkMock = sinon.stub(TruffleConfiguration.TruffleConfig.prototype, "setNetworks");
        truffleConfigGetNetworkMock = sinon.stub(TruffleConfiguration.TruffleConfig.prototype, "getNetworks");
        truffleConfigGetNetworkMock.returns(getTestTruffleNetworks());
        truffleConfigGenerateMnemonicMock = sinon.stub(TruffleConfiguration, "generateMnemonic");
        truffleConfigGenerateMnemonicMock.returns(TestConstants.testMnemonic);

        commandContextMock = sinon.mock(commands);
        executeCommandMock = commandContextMock.expects("executeCommand");

        mnemonicRepositoryMock = sinon.mock(MnemonicRepository);
        getMnemonicMock = mnemonicRepositoryMock.expects("getMnemonic").returns(TestConstants.testMnemonic);
        getAllMnemonicPathsMock = mnemonicRepositoryMock.expects("getAllMnemonicPaths").returns([] as string[]);
        saveMnemonicPathMock = mnemonicRepositoryMock.expects("saveMnemonicPath");

        writeFileSyncMock = sinon.stub(fs, "writeFileSync");

        getAccessKeysMock = sinon.stub(ConsortiumResourceExplorer.prototype, "getAccessKeys");

        getExtensionMock = sinon.stub(vscode.extensions, "getExtension").returns(AzureAccountHelper.mockExtension);
      });

      afterEach(() => {
        sinon.restore();
      });

      it("should throw exception when config file not found", async () => {
        // Arrange
        getWorkspaceRootMock.returns(__dirname);
        executeCommandMock.returns(uuid.v4());

        // Act and assert
        await assert.rejects(
          TruffleCommands.deployContracts(),
          Error,
          Constants.errorMessageStrings.TruffleConfigIsNotExist
        );
      });

      it("should throw cancellationEvent when showQuickPick return undefined", async () => {
        // Arrange
        getWorkspaceRootMock.returns(path.join(__dirname, TestConstants.truffleCommandTestDataFolder));
        executeCommandMock.returns(uuid.v4());
        showQuickPickMock.returns(undefined);

        // Act and assert
        await assert.rejects(TruffleCommands.deployContracts(), CancellationEvent);
      });

      it("should install TruffleHdWalletProvider when it required", async () => {
        // Arrange
        checkAppsSilentMock.returns(true);
        getWorkspaceRootMock.returns(path.join(__dirname, TestConstants.truffleCommandTestDataFolder));
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
        assert.strictEqual(showQuickPickMock.calledOnce, true, "showQuickPick should be called once");
        assert.strictEqual(showInputBoxMock.called, false, "showInputBox should not be called");
        assert.strictEqual(checkAppsSilentMock.calledOnce, true, "checkAppsSilent should be called once");
        assert.strictEqual(installTruffleMock.called, false, "installTruffle should not be called");
        assert.strictEqual(getWorkspaceRootMock.called, true, "getWorkspaceRoot should be called");
        assert.strictEqual(executeCommandMock.called, true, "executeCommand should be called");
        assert.strictEqual(startGanacheServerMock.called, true, "startGanacheServer should be called");
        assert.strictEqual(truffleConfigSetNetworkMock.called, false, "truffleConfig.setNetwork should not be called");
        assert.strictEqual(
          isHdWalletProviderRequiredMock.calledOnce,
          true,
          "isHdWalletProviderRequired should be called"
        );
        assert.strictEqual(
          checkHdWalletProviderVersionMock.calledOnce,
          true,
          "checkHdWalletProviderVersion should be called"
        );
        assert.strictEqual(
          installTruffleHdWalletProviderMock.calledOnce,
          true,
          "installTruffleHdWalletProvider should be called"
        );
      });

      it("should not install TruffleHdWalletProvider when it version correct", async () => {
        // Arrange
        checkAppsSilentMock.returns(true);
        getWorkspaceRootMock.returns(path.join(__dirname, TestConstants.truffleCommandTestDataFolder));
        isHdWalletProviderRequiredMock.returns(true);
        checkHdWalletProviderVersionMock.returns(true);
        executeCommandMock.returns(uuid.v4());

        showQuickPickMock.onCall(0).callsFake((items: any) => {
          return items.find((item: any) => item.label === TestConstants.servicesNames.development);
        });

        // Act
        await TruffleCommands.deployContracts();

        // Assert
        assert.strictEqual(showQuickPickMock.calledOnce, true, "showQuickPick should be called once");
        assert.strictEqual(showInputBoxMock.called, false, "showInputBox should not be called");
        assert.strictEqual(checkAppsSilentMock.calledOnce, true, "checkAppsSilent should be called once");
        assert.strictEqual(installTruffleMock.called, false, "installTruffle should not be called");
        assert.strictEqual(getWorkspaceRootMock.called, true, "getWorkspaceRoot should be called");
        assert.strictEqual(executeCommandMock.called, true, "executeCommand should be called");
        assert.strictEqual(startGanacheServerMock.called, true, "startGanacheServer should be called");
        assert.strictEqual(truffleConfigSetNetworkMock.called, false, "truffleConfig.setNetwork should not be called");
        assert.strictEqual(
          isHdWalletProviderRequiredMock.calledOnce,
          true,
          "isHdWalletProviderRequired should be called"
        );
        assert.strictEqual(
          checkHdWalletProviderVersionMock.calledOnce,
          true,
          "checkHdWalletProviderVersion should be called"
        );
        assert.strictEqual(
          installTruffleHdWalletProviderMock.calledOnce,
          false,
          "installTruffleHdWalletProvider should not be called"
        );
      });

      it("to development should throw exception when there is an error on command execution", async () => {
        // Arrange
        checkAppsSilentMock.returns(true);
        getWorkspaceRootMock.returns(path.join(__dirname, TestConstants.truffleCommandTestDataFolder));
        executeCommandMock.throws(TestConstants.testError);

        showQuickPickMock.callsFake((items: any) => {
          return items.find((item: any) => item.label === TestConstants.servicesNames.development);
        });

        // Act and assert
        await assert.rejects(TruffleCommands.deployContracts(), Error);

        assert.strictEqual(showQuickPickMock.calledOnce, true, "showQuickPick should be called once");
        assert.strictEqual(showInputBoxMock.called, false, "showInputBox should not be called");
        assert.strictEqual(checkAppsSilentMock.calledOnce, true, "checkAppsSilent should be called once");
        assert.strictEqual(installTruffleMock.called, false, "installTruffle should not be called");
        assert.strictEqual(getWorkspaceRootMock.called, true, "getWorkspaceRoot should be called");
        assert.strictEqual(executeCommandMock.called, true, "executeCommand should be called");
        assert.strictEqual(startGanacheServerMock.called, true, "startGanacheServer should be called");
        assert.strictEqual(truffleConfigSetNetworkMock.called, false, "truffleConfig.setNetwork should not be called");
        assert.strictEqual(
          isHdWalletProviderRequiredMock.calledOnce,
          true,
          "isHdWalletProviderRequired should be called"
        );
        assert.strictEqual(
          checkHdWalletProviderVersionMock.calledOnce,
          false,
          "checkHdWalletProviderVersion should not be called"
        );
        assert.strictEqual(
          installTruffleHdWalletProviderMock.calledOnce,
          false,
          "installTruffleHdWalletProvider should not be called"
        );
      });

      it("to network should complete successfully", async () => {
        // Arrange
        checkAppsSilentMock.returns(true);
        getWorkspaceRootMock.returns(path.join(__dirname, TestConstants.truffleCommandTestDataFolder));
        executeCommandMock.returns(uuid.v4());

        showQuickPickMock.onCall(0).callsFake((items: any) => {
          return items.find((item: any) => item.label === TestConstants.servicesNames.testNetwork);
        });

        // Act
        await TruffleCommands.deployContracts();

        // Assert
        assert.strictEqual(showQuickPickMock.calledOnce, true, "showQuickPick should be called once");
        assert.strictEqual(showInputBoxMock.called, false, "showInputBox should not be called");
        assert.strictEqual(checkAppsSilentMock.calledOnce, true, "checkAppsSilent should be called once");
        assert.strictEqual(installTruffleMock.called, false, "installTruffle should not be called");
        assert.strictEqual(getWorkspaceRootMock.called, true, "getWorkspaceRoot should be called");
        assert.strictEqual(executeCommandMock.called, true, "executeCommand should be called");
        assert.strictEqual(startGanacheServerMock.called, false, "startGanacheServer should not be called");
        assert.strictEqual(truffleConfigSetNetworkMock.called, false, "truffleConfig.setNetwork should not be called");
        assert.strictEqual(
          isHdWalletProviderRequiredMock.calledOnce,
          true,
          "isHdWalletProviderRequired should be called"
        );
        assert.strictEqual(
          checkHdWalletProviderVersionMock.calledOnce,
          false,
          "checkHdWalletProviderVersion should not be called"
        );
        assert.strictEqual(
          installTruffleHdWalletProviderMock.calledOnce,
          false,
          "installTruffleHdWalletProvider should not be called"
        );
      });

      it("to network should throw exception when there is an error on command execution", async () => {
        // Arrange
        checkAppsSilentMock.returns(true);
        getWorkspaceRootMock.returns(path.join(__dirname, TestConstants.truffleCommandTestDataFolder));
        executeCommandMock.throws(TestConstants.testError);

        showQuickPickMock.onCall(0).callsFake((items: any) => {
          return items.find((item: any) => item.label === TestConstants.servicesNames.testNetwork);
        });

        // Act and assert
        await assert.rejects(TruffleCommands.deployContracts());
        assert.strictEqual(showQuickPickMock.calledOnce, true, "showQuickPick should be called once");
        assert.strictEqual(showInputBoxMock.called, false, "showInputBox should not be called");
        assert.strictEqual(checkAppsSilentMock.calledOnce, true, "checkAppsSilent should be called once");
        assert.strictEqual(installTruffleMock.called, false, "installTruffle should not be called");
        assert.strictEqual(getWorkspaceRootMock.called, true, "getWorkspaceRoot should be called");
        assert.strictEqual(executeCommandMock.called, true, "executeCommand should be called");
        assert.strictEqual(startGanacheServerMock.called, false, "startGanacheServer should not be called");
        assert.strictEqual(truffleConfigSetNetworkMock.called, false, "truffleConfig.setNetwork should not be called");
        assert.strictEqual(
          isHdWalletProviderRequiredMock.calledOnce,
          true,
          "isHdWalletProviderRequired should be called"
        );
        assert.strictEqual(
          checkHdWalletProviderVersionMock.calledOnce,
          false,
          "checkHdWalletProviderVersion should not be called"
        );
        assert.strictEqual(
          installTruffleHdWalletProviderMock.calledOnce,
          false,
          "installTruffleHdWalletProvider should not be called"
        );
      });

      it("to local network should complete successfully", async () => {
        // Arrange
        const {local} = TestConstants.consortiumTestNames;
        checkAppsSilentMock.returns(true);
        getWorkspaceRootMock.returns(path.join(__dirname, TestConstants.truffleCommandTestDataFolder));
        executeCommandMock.returns(uuid.v4());

        const networkNodeName = getDeployName(service.local.prefix, local, local);

        showQuickPickMock.onCall(0).callsFake((items: any) => {
          return items.find((item: any) => item.label === networkNodeName);
        });

        // Act
        await TruffleCommands.deployContracts();

        // Assert
        assert.strictEqual(showQuickPickMock.calledOnce, true, "showQuickPick should be called once");
        assert.strictEqual(showInputBoxMock.called, false, "showInputBox should not be called");
        assert.strictEqual(checkAppsSilentMock.calledOnce, true, "checkAppsSilent should be called once");
        assert.strictEqual(installTruffleMock.called, false, "installTruffle should not be called");
        assert.strictEqual(getWorkspaceRootMock.called, true, "getWorkspaceRoot should be called");
        assert.strictEqual(executeCommandMock.called, true, "executeCommand should be called");
        assert.strictEqual(startGanacheServerMock.called, true, "startGanacheServer should be called");
        assert.strictEqual(truffleConfigSetNetworkMock.called, true, "truffleConfig.setNetwork should be called");
        assert.strictEqual(
          isHdWalletProviderRequiredMock.calledOnce,
          true,
          "isHdWalletProviderRequired should be called"
        );
        assert.strictEqual(
          checkHdWalletProviderVersionMock.calledOnce,
          false,
          "checkHdWalletProviderVersion should not be called"
        );
        assert.strictEqual(
          installTruffleHdWalletProviderMock.calledOnce,
          false,
          "installTruffleHdWalletProvider should not be called"
        );
      });

      it("to local network should throw exception when there is an error on command execution", async () => {
        // Arrange
        const {local} = TestConstants.consortiumTestNames;
        checkAppsSilentMock.returns(true);
        getWorkspaceRootMock.returns(path.join(__dirname, TestConstants.truffleCommandTestDataFolder));
        executeCommandMock.throws(TestConstants.testError);

        const networkNodeName = getDeployName(service.local.prefix, local, local);

        showQuickPickMock.onCall(0).callsFake((items: any) => {
          return items.find((item: any) => item.label === networkNodeName);
        });

        // Act and assert
        await assert.rejects(TruffleCommands.deployContracts());
        assert.strictEqual(showQuickPickMock.calledOnce, true, "showQuickPick should be called once");
        assert.strictEqual(showInputBoxMock.called, false, "showInputBox should not be called");
        assert.strictEqual(checkAppsSilentMock.calledOnce, true, "checkAppsSilent should be called once");
        assert.strictEqual(installTruffleMock.called, false, "installTruffle should not be called");
        assert.strictEqual(getWorkspaceRootMock.called, true, "getWorkspaceRoot should be called");
        assert.strictEqual(executeCommandMock.called, true, "executeCommand should be called");
        assert.strictEqual(startGanacheServerMock.called, true, "startGanacheServer should be called");
        assert.strictEqual(truffleConfigSetNetworkMock.called, true, "truffleConfig.setNetwork should be called");
        assert.strictEqual(
          isHdWalletProviderRequiredMock.calledOnce,
          true,
          "isHdWalletProviderRequired should be called"
        );
        assert.strictEqual(
          checkHdWalletProviderVersionMock.calledOnce,
          false,
          "checkHdWalletProviderVersion should not be called"
        );
        assert.strictEqual(
          installTruffleHdWalletProviderMock.calledOnce,
          false,
          "installTruffleHdWalletProvider should not be called"
        );
      });

      it("to AzureBlockchain Service should generate mnemonic and complete successfully", async () => {
        // Arrange
        const {consortium, member, transactionNode} = azureNames;
        checkAppsSilentMock.returns(true);
        getWorkspaceRootMock.returns(path.join(__dirname, TestConstants.truffleCommandTestDataFolder));
        executeCommandMock.returns(uuid.v4());
        getAccessKeysMock.returns(uuid.v4());

        const networkNodeName = getDeployName(service.azure.prefix, consortium, transactionNode, [member]);

        showQuickPickMock.onCall(0).callsFake((items: any) => {
          return items.find((item: any) => item.label === networkNodeName);
        });

        showQuickPickMock.onCall(1).callsFake((items: any) => {
          return items.find((item: any) => item.label === Constants.placeholders.generateMnemonic);
        });

        showSaveDialogMock.returns(uuid.v4());

        // Act
        await TruffleCommands.deployContracts();

        // Assert
        assert.strictEqual(showQuickPickMock.called, true, "showQuickPick should be called");
        assert.strictEqual(showQuickPickMock.callCount, 2, "showQuickPick should be called twice");
        assert.strictEqual(getAccessKeysMock.called, true, "getAccessKeys should be called");
        assert.strictEqual(showInputBoxMock.called, false, "showInputBox should not be called");
        assert.strictEqual(getMnemonicMock.called, false, "getMnemonic should not be called");
        assert.strictEqual(getAllMnemonicPathsMock.called, true, "getAllMnemonicPaths should be called");
        assert.strictEqual(saveMnemonicPathMock.called, true, "saveMnemonicPath should be called");
        assert.strictEqual(writeFileSyncMock.called, true, "writeFileSync should be called");
        assert.strictEqual(checkAppsSilentMock.calledOnce, true, "checkAppsSilent should be called once");
        assert.strictEqual(installTruffleMock.called, false, "installTruffle should not be called");
        assert.strictEqual(getWorkspaceRootMock.called, true, "getWorkspaceRoot should be called");
        assert.strictEqual(executeCommandMock.called, true, "executeCommand should be called");
        assert.strictEqual(startGanacheServerMock.called, false, "startGanacheServer should not be called");
        assert.strictEqual(truffleConfigSetNetworkMock.called, true, "truffleConfig.setNetwork should be called");
        assert.strictEqual(getExtensionMock.called, true, "getExtension should be called");
        assert.strictEqual(
          isHdWalletProviderRequiredMock.calledOnce,
          true,
          "isHdWalletProviderRequired should be called"
        );
        assert.strictEqual(
          checkHdWalletProviderVersionMock.calledOnce,
          false,
          "checkHdWalletProviderVersion should not be called"
        );
        assert.strictEqual(
          installTruffleHdWalletProviderMock.calledOnce,
          false,
          "installTruffleHdWalletProvider should not be called"
        );
      });

      it("to AzureBlockchainService should complete successfully when user paste mnemonic", async () => {
        // Arrange
        const {consortium, member, transactionNode} = azureNames;
        checkAppsSilentMock.returns(true);
        getWorkspaceRootMock.returns(path.join(__dirname, TestConstants.truffleCommandTestDataFolder));
        executeCommandMock.returns(uuid.v4());
        getAccessKeysMock.returns(uuid.v4());

        const networkNodeName = getDeployName(service.azure.prefix, consortium, transactionNode, [member]);

        showQuickPickMock.onCall(0).callsFake((items: any) => {
          return items.find((item: any) => item.label === networkNodeName);
        });

        showQuickPickMock.onCall(1).callsFake((items: any) => {
          return items.find((item: any) => item.label === Constants.placeholders.pasteMnemonic);
        });

        showInputBoxMock.onCall(0).returns(TestConstants.testMnemonic);
        showSaveDialogMock.returns(uuid.v4());

        // Act
        await TruffleCommands.deployContracts();

        // Assert
        assert.strictEqual(showQuickPickMock.called, true, "showQuickPick should be called");
        assert.strictEqual(showQuickPickMock.callCount, 2, "showQuickPick should be called twice");
        assert.strictEqual(getAccessKeysMock.called, true, "getAccessKeys should be called");
        assert.strictEqual(showInputBoxMock.calledOnce, true, "showInputBox should be called once");
        assert.strictEqual(getMnemonicMock.called, false, "getMnemonic should not be called");
        assert.strictEqual(getAllMnemonicPathsMock.called, true, "getAllMnemonicPaths should be called");
        assert.strictEqual(saveMnemonicPathMock.called, true, "saveMnemonicPath should be called");
        assert.strictEqual(writeFileSyncMock.called, true, "writeFileSync should be called");
        assert.strictEqual(checkAppsSilentMock.calledOnce, true, "checkAppsSilent should be called once");
        assert.strictEqual(installTruffleMock.called, false, "installTruffle should not be called");
        assert.strictEqual(getWorkspaceRootMock.called, true, "getWorkspaceRoot should be called");
        assert.strictEqual(executeCommandMock.called, true, "executeCommand should be called");
        assert.strictEqual(startGanacheServerMock.called, false, "startGanacheServer should not be called");
        assert.strictEqual(truffleConfigSetNetworkMock.called, true, "truffleConfig.setNetwork should be called");
        assert.strictEqual(getExtensionMock.called, true, "getExtension should be called");
        assert.strictEqual(
          isHdWalletProviderRequiredMock.calledOnce,
          true,
          "isHdWalletProviderRequired should be called"
        );
        assert.strictEqual(
          checkHdWalletProviderVersionMock.calledOnce,
          false,
          "checkHdWalletProviderVersion should not be called"
        );
        assert.strictEqual(
          installTruffleHdWalletProviderMock.calledOnce,
          false,
          "installTruffleHdWalletProvider should not be called"
        );
      });

      it("Blockchain Data Manager should be ignored in deploy destination list", async () => {
        // Arrange
        let isBDMExist = false;
        const {local} = TestConstants.consortiumTestNames;
        checkAppsSilentMock.returns(true);
        getWorkspaceRootMock.returns(path.join(__dirname, TestConstants.truffleCommandTestDataFolder));
        executeCommandMock.returns(uuid.v4());

        const networkNodeName = getDeployName(service.local.prefix, local, local);

        showQuickPickMock.onCall(0).callsFake((items: any) => {
          isBDMExist = items.some((item: any) => item.detail === Constants.treeItemData.service.bdm.label);
          return items.find((item: any) => item.label === networkNodeName);
        });

        // Act
        await TruffleCommands.deployContracts();

        // Assert
        assert.strictEqual(isBDMExist, false, "deploy destination list should not have Blockchain Data Manager");
      });
    });
  });
});

const azureNames = {
  consortium: uuid.v4(),
  member: uuid.v4(),
  transactionNode: TestConstants.servicesNames.testConsortium,
};

async function createTestServicesItems(): Promise<Service[]> {
  const services: Service[] = [];

  const trufflesuite = new AzureBlockchainService();
  const localService = new LocalService();
  const infuraService = new InfuraService();
  const bdmService = new BlockchainDataManagerService();

  const azureBlockchainProject = new AzureBlockchainProject(azureNames.consortium, uuid.v4(), uuid.v4(), [
    azureNames.member,
  ]);
  const member = new Member(azureNames.member);
  const transactionNode = new AzureBlockchainNetworkNode(
    azureNames.transactionNode,
    uuid.v4(),
    "*",
    "",
    "",
    azureNames.member
  );
  member.addChild(transactionNode);
  azureBlockchainProject.addChild(member);

  const defaultPort = 8545;
  const defaultLabel = TestConstants.consortiumTestNames.local;
  const localProject = new LocalProject(defaultLabel, defaultPort);
  const defaultUrl = `${Constants.networkProtocols.http}${Constants.localhost}:${defaultPort}`;
  const localNetworkNode = new LocalNetworkNode(defaultLabel, defaultUrl, "*");
  localProject.addChild(localNetworkNode);

  const infuraProject = new InfuraProject(uuid.v4(), uuid.v4());
  const infuraNetworkNode = new InfuraNetworkNode(uuid.v4(), uuid.v4(), uuid.v4());
  infuraProject.addChild(infuraNetworkNode);

  const bdmProject = new BlockchainDataManagerProject(uuid.v4(), uuid.v4(), uuid.v4());
  const bdmNetworkNode = new BlockchainDataManagerNetworkNode(
    uuid.v4(),
    "*",
    uuid.v4(),
    uuid.v4(),
    [],
    ItemType.BLOCKCHAIN_DATA_MANAGER_APPLICATION,
    uuid.v4()
  );
  bdmProject.addChild(bdmNetworkNode);

  trufflesuite.addChild(azureBlockchainProject);
  localService.addChild(localProject);
  infuraService.addChild(infuraProject);
  bdmService.addChild(bdmProject);

  services.push(trufflesuite, localService, infuraService, bdmService);

  return services;
}

function getTestTruffleNetworks(): TruffleConfiguration.INetwork[] {
  const networks: TruffleConfiguration.INetwork[] = [];

  networks.push(
    {
      name: TestConstants.servicesNames.development,
      options: {
        host: "127.0.0.1",
        network_id: "*",
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
    return [prefix, projectName, ...args, nodeName].join("_");
  }

  return [prefix, projectName, nodeName].join("_");
}
