// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import assert from "assert";
import rewire from "rewire";
import sinon from "sinon";
import uuid from "uuid";
import vscode, {Uri} from "vscode";
import {Constants} from "../../../src/Constants";
import {ItemType} from "../../../src/Models";
import {LocalService, InfuraProject, Project} from "../../../src/Models/TreeItems";
import {InfuraResourceExplorer} from "../../../src/resourceExplorers";
import {GanacheService, TreeManager} from "../../../src/services";
const {project} = Constants.treeItemData;

const mockExtension: vscode.Extension<{}> = {
  extensionUri: Uri.parse(""),
  activate: mockActivate,
  exports: {},
  extensionKind: vscode.ExtensionKind.UI,
  extensionPath: uuid.v4(),
  id: uuid.v4(),
  isActive: true,
  packageJSON: uuid.v4(),
};

async function waitAmoment(): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, 1);
  });
}

async function mockActivate(): Promise<{}> {
  await waitAmoment();
  return {};
}

describe("Service Commands", () => {
  let vscodeWindowMock: sinon.SinonMock;

  before(() => {
    sinon.restore();
  });

  after(() => {
    sinon.restore();
  });

  describe("Integration tests", () => {
    let serviceCommandsRewire: any;

    beforeEach(() => {
      serviceCommandsRewire = rewire("../../../src/commands/ServiceCommands");
    });

    describe("connectProject returns project", () => {
      let selectedDestination: any;
      let addChildStub: sinon.SinonStub<any, any>;
      let showQuickPickMock: sinon.SinonStub<any[], any>;
      let showInputBoxMock: sinon.SinonExpectation;
      let startGanacheServerStub: any;
      let selectProjectMock: any;

      beforeEach(() => {
        vscodeWindowMock = sinon.mock(vscode.window);
        showQuickPickMock = vscodeWindowMock.expects("showQuickPick");
        showInputBoxMock = vscodeWindowMock.expects("showInputBox");

        startGanacheServerStub = sinon
          .stub(GanacheService, "startGanacheServer")
          .callsFake(() => Promise.resolve({pid: 1234, port: 4321}));

        sinon.stub(GanacheService, "getPortStatus").resolves(GanacheService.PortStatus.FREE);

        sinon.stub(TreeManager, "getItem").callsFake(() => {
          const ret = new LocalService();
          addChildStub = sinon.stub(ret, "addChild");
          return ret;
        });

        sinon.stub(vscode.extensions, "getExtension").returns(mockExtension);
      });

      afterEach(() => {
        sinon.restore();
      });

      function assertAfterEachTest(result: Project, itemType: number, contextValue: string, labelName: string) {
        assert.strictEqual(
          selectedDestination.cmd.calledOnce,
          true,
          "selectedDestination command should be called once"
        );
        assert.strictEqual(addChildStub.calledOnce, true, "addChild should be called once");
        assert.strictEqual(result.itemType, itemType, "returned result should store correct itemType");
        assert.strictEqual(result.contextValue, contextValue, "returned result should store correct contextValue");
        assert.strictEqual(result.label, labelName, "returned result should store correct label");
      }

      it("for Local Service destination.", async () => {
        // Arrange
        let validationMessage;
        const defaultPort = "6553";
        const defaultName = "localProjectName";
        const expectedLabel = `${defaultName}`;
        const defaultUrl = `${Constants.networkProtocols.http}${Constants.localhost}:${defaultPort}`;

        showQuickPickMock.callsFake(async (...args: any[]) => {
          selectedDestination = args[0].find((service: any) => service.itemType === ItemType.LOCAL_SERVICE);
          selectedDestination.cmd = sinon.spy(selectedDestination.cmd);
          return selectedDestination;
        });

        showInputBoxMock.twice();
        showInputBoxMock.onCall(0).callsFake(async (..._args: any[]) => {
          validationMessage = await _args[0].validateInput(defaultPort);
          return defaultPort;
        });

        showInputBoxMock.onCall(1).callsFake(async (..._args: any[]) => {
          validationMessage = await _args[0].validateInput(defaultName);
          return defaultName;
        });

        // Act
        const result = await serviceCommandsRewire.ServiceCommands.connectProject();

        // Assert
        assertAfterEachTest(result, ItemType.LOCAL_PROJECT, project.local.contextValue, expectedLabel);
        assert.strictEqual(showInputBoxMock.called, true, "showInputBox should be called");
        assert.strictEqual(showInputBoxMock.callCount, 2, "showInputBox should be called twice");
        assert.strictEqual(startGanacheServerStub.calledOnce, true, "startGanacheServer command should called once");
        assert.strictEqual(result.children[0].url.origin, defaultUrl, "returned result should store correct url");
        assert.notStrictEqual(validationMessage, undefined, "validationMessage should not be undefined");
      });

      it("for Infura Service destination.", async () => {
        // Arrange
        const label = uuid.v4.toString();
        selectProjectMock = sinon.stub(InfuraResourceExplorer.prototype, "selectProject");
        const infuraProject = new InfuraProject(label, uuid.v4());
        selectProjectMock.returns(infuraProject);

        showQuickPickMock.callsFake(async (...args: any[]) => {
          const destination = args[0].find((x: any) => x.itemType === ItemType.INFURA_SERVICE);
          selectedDestination = destination;
          selectedDestination.cmd = sinon.spy(destination.cmd);

          return selectedDestination;
        });

        // Act
        const result = await serviceCommandsRewire.ServiceCommands.connectProject();

        // Assert
        assertAfterEachTest(result, ItemType.INFURA_PROJECT, project.infura.contextValue, label);
        assert.strictEqual(startGanacheServerStub.notCalled, true, "startGanacheServer command should not be called");
        assert.strictEqual(selectProjectMock.calledOnce, true, "selectProject should be called once");
      });
    });
  });
});
