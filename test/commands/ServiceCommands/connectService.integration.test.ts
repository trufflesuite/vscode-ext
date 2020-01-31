// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as assert from 'assert';
import rewire = require('rewire');
import * as sinon from 'sinon';
import * as uuid from 'uuid';
import * as vscode from 'vscode';
import { Constants } from '../../../src/Constants';
import { ItemType } from '../../../src/Models';
import { AzureBlockchainProject, AzureBlockchainService, BlockchainDataManagerProject, InfuraProject, Project } from '../../../src/Models/TreeItems';
import { BlockchainDataManagerResourceExplorer, ConsortiumResourceExplorer, InfuraResourceExplorer } from '../../../src/resourceExplorers';
import { GanacheService, TreeManager } from '../../../src/services';
import { AzureAccountHelper } from '../../testHelpers/AzureAccountHelper';
const { project } = Constants.treeItemData;

describe('Service Commands', () => {
  let defaultConsortiumName: string;
  let defaultSubscriptionId: string;
  let defaultResourceGroup: string;
  let defaultMemberName: string;
  let vscodeWindowMock: sinon.SinonMock;

  before(() => {
    sinon.restore();

    defaultConsortiumName = uuid.v4();
    defaultSubscriptionId = uuid.v4();
    defaultResourceGroup = uuid.v4();
    defaultMemberName = uuid.v4();
  });

  after(() => {
    sinon.restore();
  });

  describe('Integration tests', () => {
    let serviceCommandsRewire: any;

    beforeEach(() => {
      serviceCommandsRewire = rewire('../../../src/commands/ServiceCommands');
    });

    describe('connectProject returns project', () => {
      let selectedDestination: any;
      let addChildStub: sinon.SinonStub<any, any>;
      let showQuickPickMock: sinon.SinonStub<any[], any>;
      let showInputBoxMock: sinon.SinonExpectation;
      let selectConsortiumMock: any;
      let startGanacheServerStub: any;
      let selectProjectMock: any;

      beforeEach(() => {
        vscodeWindowMock = sinon.mock(vscode.window);
        showQuickPickMock = vscodeWindowMock.expects('showQuickPick');
        showInputBoxMock = vscodeWindowMock.expects('showInputBox');

        startGanacheServerStub = sinon.stub(GanacheService, 'startGanacheServer')
          .callsFake(() => Promise.resolve({ pid: 1234, port: 4321 }));

        sinon.stub(GanacheService, 'getPortStatus')
          .resolves(GanacheService.PortStatus.FREE);

        sinon.stub(TreeManager, 'getItem')
          .callsFake(() => {
            const azureBlockchainService = new AzureBlockchainService();
            addChildStub = sinon.stub(azureBlockchainService, 'addChild');
            return azureBlockchainService;
          });

        selectConsortiumMock = sinon.stub(ConsortiumResourceExplorer.prototype, 'selectProject')
          .returns(Promise.resolve(
            new AzureBlockchainProject(
              defaultConsortiumName,
              defaultSubscriptionId,
              defaultResourceGroup,
              [defaultMemberName],
            )),
          );
        sinon.stub(vscode.extensions, 'getExtension').returns(AzureAccountHelper.mockExtension);
      });

      afterEach(() => {
        sinon.restore();
      });

      function assertAfterEachTest(result: Project, itemType: number, contextValue: string, labelName: string) {
        assert.strictEqual(
          selectedDestination.cmd.calledOnce,
          true,
          'selectedDestination command should be called once',
        );
        assert.strictEqual(addChildStub.calledOnce, true, 'addChild should be called once');
        assert.strictEqual(result.itemType, itemType, 'returned result should store correct itemType');
        assert.strictEqual(result.contextValue, contextValue, 'returned result should store correct contextValue');
        assert.strictEqual(result.label, labelName, 'returned result should store correct label');
      }

      it('for Local Service destination.', async () => {
        // Arrange
        let validationMessage;
        const defaultPort = '6553';
        const defaultName = 'localProjectName';
        const expectedLabel = `${defaultName}`;
        const defaultUrl = `${Constants.networkProtocols.http}${Constants.localhost}:${defaultPort}`;

        showQuickPickMock.callsFake(async (...args: any[]) => {
          selectedDestination = args[0].find((service: any) => service.itemType === ItemType.LOCAL_SERVICE);
          selectedDestination.cmd = sinon.spy(selectedDestination.cmd);
          return selectedDestination;
        });

        showInputBoxMock.twice();
        showInputBoxMock.onCall(0).callsFake(async (..._args: any[]) => {
          validationMessage = await _args[0].validateInput(defaultName);
          return defaultName;
        });

        showInputBoxMock.onCall(1).callsFake(async (..._args: any[]) => {
          validationMessage = await _args[0].validateInput(defaultPort);
          return defaultPort;
        });

        // Act
        const result = await serviceCommandsRewire.ServiceCommands.connectProject();

        // Assert
        assertAfterEachTest(
          result,
          ItemType.LOCAL_PROJECT,
          project.local.contextValue,
          expectedLabel,
        );
        assert.strictEqual(showInputBoxMock.called, true, 'showInputBox should be called');
        assert.strictEqual(showInputBoxMock.callCount, 2, 'showInputBox should be called twice');
        assert.strictEqual(startGanacheServerStub.calledOnce, true, 'startGanacheServer command should called once');
        assert.strictEqual(result.children[0].url.origin, defaultUrl, 'returned result should store correct url');
        assert.notStrictEqual(validationMessage, undefined, 'validationMessage should not be undefined');
      });

      it('for Azure Blockchain Service destination.', async () => {
        // Arrange
        showQuickPickMock.callsFake(async (...args: any[]) => {
          const destination = args[0].find((x: any) => x.itemType === ItemType.AZURE_BLOCKCHAIN_SERVICE);
          selectedDestination = destination;
          selectedDestination.cmd = sinon.spy(destination.cmd);

          return selectedDestination;
        });

        // Act
        const result = await serviceCommandsRewire.ServiceCommands.connectProject();

        // Assert
        assertAfterEachTest(
          result,
          ItemType.AZURE_BLOCKCHAIN_PROJECT,
          project.azure.contextValue,
          defaultConsortiumName,
        );
        assert.strictEqual(startGanacheServerStub.notCalled, true, 'startGanacheServer command should not be called');
        assert.strictEqual(selectConsortiumMock.calledOnce, true, 'selectProject should be called once');
      });

      it('for Infura Service destination.', async () => {
        // Arrange
        const label = uuid.v4.toString();
        selectProjectMock = sinon.stub(InfuraResourceExplorer.prototype, 'selectProject');
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
        assertAfterEachTest(
          result,
          ItemType.INFURA_PROJECT,
          project.infura.contextValue,
          label,
        );
        assert.strictEqual(startGanacheServerStub.notCalled, true, 'startGanacheServer command should not be called');
        assert.strictEqual(selectProjectMock.calledOnce, true, 'selectProject should be called once');
      });

      it('for Blockchain Data Manager Service destination.', async () => {
        // Arrange
        const label = uuid.v4.toString();
        selectProjectMock = sinon.stub(BlockchainDataManagerResourceExplorer.prototype, 'selectProject');
        const bdmProject = new BlockchainDataManagerProject(label, uuid.v4(), uuid.v4());
        selectProjectMock.returns(bdmProject);

        showQuickPickMock.callsFake(async (...args: any[]) => {
          const destination = args[0].find((x: any) => x.itemType === ItemType.BLOCKCHAIN_DATA_MANAGER_SERVICE);
          selectedDestination = destination;
          selectedDestination.cmd = sinon.spy(destination.cmd);

          return selectedDestination;
        });

        // Act
        const result = await serviceCommandsRewire.ServiceCommands.connectProject();

        // Assert
        assertAfterEachTest(
          result,
          ItemType.BLOCKCHAIN_DATA_MANAGER_PROJECT,
          project.bdm.contextValue,
          label,
        );
        assert.strictEqual(startGanacheServerStub.notCalled, true, 'startGanacheServer command should not be called');
        assert.strictEqual(selectProjectMock.calledOnce, true, 'selectProject should be called once');
      });
    });
  });
});
