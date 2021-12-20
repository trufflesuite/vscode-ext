// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import assert from "assert";
import sinon from "sinon";
import uuid from "uuid";
import * as vscode from "vscode";
import {ServiceCommands} from "../../../src/commands";
import {Constants} from "../../../src/Constants";
import {ItemType} from "../../../src/Models";
import {
  AzureBlockchainService,
  IExtensionItem,
  InfuraProject,
  InfuraService,
  LocalService,
  Project,
  Service,
} from "../../../src/Models/TreeItems";
import {InfuraResourceExplorer} from "../../../src/resourceExplorers";
import {GanacheService, TreeManager} from "../../../src/services";
import {getRandomInt} from "../../testHelpers/Random";
const {project, service} = Constants.treeItemData;

describe("Service Commands", () => {
  let getItemsMock: any;
  let getItemMock: any;
  let loadStateMock: sinon.SinonStub<[], IExtensionItem[]>;
  let testServiceItems: Service[];
  let showQuickPickMock: any;
  let showInputBoxMock: any;
  let ganacheServiceMock: sinon.SinonMock;
  let getPortStatusMock: sinon.SinonExpectation;
  let startGanacheServerMock: sinon.SinonExpectation;
  let selectProjectMock: any;

  let azureGroup: Service;
  let localGroup: Service;
  let infuraGroup: Service;

  function initializeNetworks() {
    azureGroup = new AzureBlockchainService();
    localGroup = new LocalService();
    infuraGroup = new InfuraService();
  }

  function createTestServiceItems() {
    const services: Service[] = [];
    services.push(azureGroup, localGroup);

    return services;
  }

  beforeEach(() => {
    initializeNetworks();

    getItemsMock = sinon.stub(TreeManager, "getItems");
    getItemMock = sinon.stub(TreeManager, "getItem");
    loadStateMock = sinon.stub(TreeManager, "loadState");
    testServiceItems = createTestServiceItems();
    getItemsMock.returns(testServiceItems);
    loadStateMock.returns(testServiceItems);

    ganacheServiceMock = sinon.mock(GanacheService);
    getPortStatusMock = ganacheServiceMock.expects("getPortStatus");
    startGanacheServerMock = ganacheServiceMock.expects("startGanacheServer");

    showQuickPickMock = sinon.stub(vscode.window, "showQuickPick");
    showInputBoxMock = sinon.stub(vscode.window, "showInputBox");
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("Unit tests", () => {
    describe("connectProject provides types of service destination and returns new service", () => {
      function assertAfterEachTest(result: Project, itemType: number, contextValue: string, name: string) {
        assert.strictEqual(result.label, name, "returned result should store correct label");
        assert.strictEqual(result.itemType, itemType, "returned result should store correct itemType");
        assert.strictEqual(result.contextValue, contextValue, "returned result should store correct contextValue");
      }

      it("for Local Service destination.", async () => {
        // Arrange
        const port = getRandomInt(65535);
        const name = "localProjectName";
        const expectedLabel = `${name}`;
        getItemMock.returns(localGroup);
        showQuickPickMock.onCall(0).callsFake((items: any) => {
          return items.find((item: any) => item.label === service.local.label);
        });
        showInputBoxMock.onCall(0).returns(name);
        showInputBoxMock.onCall(1).returns(port);
        getPortStatusMock.returns(GanacheService.PortStatus.FREE);

        // Act
        const result = await ServiceCommands.connectProject();

        // Assert
        assertAfterEachTest(result, ItemType.LOCAL_PROJECT, project.local.contextValue, expectedLabel);
        assert.strictEqual(startGanacheServerMock.called, true, "startGanacheServer should be called");
      });

      it("for Infura Service destination.", async () => {
        // Arrange
        const label = uuid.v4.toString();
        getItemMock.returns(infuraGroup);
        showQuickPickMock.onCall(0).callsFake((items: any) => {
          return items.find((item: any) => item.label === service.infura.label);
        });

        selectProjectMock = sinon.stub(InfuraResourceExplorer.prototype, "selectProject");
        const infuraProject = new InfuraProject(label, uuid.v4());
        selectProjectMock.returns(infuraProject);

        // Act
        const result = await ServiceCommands.connectProject();

        // Assert
        assert.strictEqual(selectProjectMock.calledOnce, true);
        assertAfterEachTest(result, ItemType.INFURA_PROJECT, project.infura.contextValue, label.toString());
      });
    });

    describe("connectProject should rejects", () => {
      it("for Local Service when port is empty", async () => {
        // Arrange
        getItemMock.returns(localGroup);
        showQuickPickMock.onCall(0).callsFake((items: any) => {
          return items.find((item: any) => item.label === service.local.label);
        });
        showInputBoxMock.returns(undefined);
        getPortStatusMock.returns(GanacheService.PortStatus.NOT_GANACHE);

        // Act and assert
        await assert.rejects(ServiceCommands.connectProject());
      });
    });
  });
});
