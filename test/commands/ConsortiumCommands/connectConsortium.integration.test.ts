// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as assert from 'assert';
import rewire = require('rewire');
import * as sinon from 'sinon';
import * as uuid from 'uuid';
import * as vscode from 'vscode';
import { ConsortiumResourceExplorer } from '../../../src/ConsortiumResourceExplorer';
import { Constants } from '../../../src/Constants';
import { GanacheService } from '../../../src/GanacheService/GanacheService';
import {
  AzureConsortium,
  Consortium,
  ItemType,
  Network,
} from '../../../src/Models';
import { AzureAccountHelper } from '../../testHepers/azureAccountHelper';

describe('Consortium Commands', () => {
  let defaultConsortiumName: string;
  let defaultSubscriptionId: string;
  let defaultResourcesGroup: string;
  let defaultMemberName: string;
  let defaultNetworkName: string;
  let vscodeWindowMock: sinon.SinonMock;

  before(() => {
    sinon.restore();

    defaultConsortiumName = uuid.v4();
    defaultSubscriptionId = uuid.v4();
    defaultResourcesGroup = uuid.v4();
    defaultMemberName = uuid.v4();
    defaultNetworkName = uuid.v4();
  });

  after(() => {
    sinon.restore();
  });

  beforeEach(() => {
    vscodeWindowMock = sinon.mock(vscode.window);
  });

  afterEach(() => {
    vscodeWindowMock.restore();
  });

  describe('Integration tests', () => {
    let consortiumCommandsRewire: any;
    let consortiumTreeManager: { __proto__: any; ConsortiumTreeManager: { prototype: any; new(): void; }; };

    before(() => {
      consortiumTreeManager = require('../../../src/treeService/ConsortiumTreeManager');
      sinon.stub(consortiumTreeManager.__proto__, 'constructor');
      sinon.stub(consortiumTreeManager.ConsortiumTreeManager.prototype, 'loadState').returns({});
    });

    beforeEach(() => {
      consortiumCommandsRewire = rewire('../../../src/commands/ConsortiumCommands');
    });

    describe('connectConsortium returns consortium', () => {
      const defaultConsortiumUrl = 'http://127.0.0.1:2345';
      let selectedDestination: any;
      let getItemStub: sinon.SinonStub<any[], any> | sinon.SinonStub<unknown[], {}>;
      let addChildStub: sinon.SinonStub<any, any>;
      let showQuickPickMock: sinon.SinonStub<any[], any>;
      let showInputBoxMock: sinon.SinonExpectation;
      let selectOrCreateConsortiumMock: any;
      let startGanacheCmdStub: any;

      beforeEach(() => {
        showQuickPickMock = vscodeWindowMock.expects('showQuickPick');
        showInputBoxMock = vscodeWindowMock.expects('showInputBox');

        startGanacheCmdStub
          = sinon.stub(GanacheService, 'startGanacheServer').callsFake(() => Promise.resolve(null));

        getItemStub = sinon.stub(consortiumTreeManager.ConsortiumTreeManager.prototype, 'getItem')
          .callsFake((...args: any[]) => {
            const network = new Network(defaultNetworkName, args[0]);
            addChildStub = sinon.stub(network, 'addChild');
            return network;
          });

        selectOrCreateConsortiumMock = sinon.stub(ConsortiumResourceExplorer.prototype,
          'selectOrCreateConsortium').returns(Promise.resolve(
            new AzureConsortium(
              defaultConsortiumName,
              defaultSubscriptionId,
              defaultResourcesGroup,
              defaultMemberName)));
      });

      afterEach(() => {
        startGanacheCmdStub.restore();
        selectOrCreateConsortiumMock.restore();
        getItemStub.restore();
      });

      function assertAfterEachTest(result: Consortium, itemType: number, contextValue: string, labelName: string) {
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

      it('for Local Network destination.', async () => {
        // Arrange
        let validationMessage;
        const defaultPort = '1234';
        const defaultLabel = `${Constants.localhostName}:${defaultPort}`;
        const defaultUrl = `${Constants.networkProtocols.http}${Constants.localhost}:${defaultPort}`;

        showQuickPickMock.callsFake(async (...args: any[]) => {
          selectedDestination = args[0].find((x: any) => x.itemType === ItemType.LOCAL_NETWORK);
          selectedDestination.cmd = sinon.spy(selectedDestination.cmd);
          return selectedDestination;
        });

        showInputBoxMock.callsFake(async (..._args: any[]) => {
          validationMessage = await _args[0].validateInput(defaultPort);
          return defaultPort;
        });

        // Act
        const result = await consortiumCommandsRewire.ConsortiumCommands
          .connectConsortium(new consortiumTreeManager.ConsortiumTreeManager());

        // Assert
        assertAfterEachTest(result, ItemType.LOCAL_CONSORTIUM, Constants.contextValue.localConsortium, defaultLabel);
        assert.strictEqual(startGanacheCmdStub.calledOnce, true, 'startGanache command should called once');
        assert.strictEqual(result.urls[0].origin, defaultUrl, 'returned result should store correct url');
        assert.notStrictEqual(validationMessage, undefined, 'validationMessage should not be undefined');
      }).timeout(10000);

      it('for Azure Blockchain Network destination.', async () => {
        // Arrange
        const getExtensionMock = sinon.stub(vscode.extensions, 'getExtension')
          .returns(AzureAccountHelper.mockExtension);

        showQuickPickMock.callsFake(async (...args: any[]) => {
          const destination = args[0].find((x: any) => x.itemType === ItemType.AZURE_BLOCKCHAIN);
          selectedDestination = destination;
          selectedDestination.cmd = sinon.spy(destination.cmd);

          return selectedDestination;
        });

        // Act
        const result = await consortiumCommandsRewire.ConsortiumCommands
          .connectConsortium(new consortiumTreeManager.ConsortiumTreeManager());

        // Assert
        assertAfterEachTest(
          result, ItemType.AZURE_CONSORTIUM, Constants.contextValue.consortium, defaultConsortiumName);
        assert.strictEqual(startGanacheCmdStub.notCalled, true, 'startGanache command should not be called');
        assert.strictEqual(
          selectOrCreateConsortiumMock.calledOnce,
          true,
          'selectOrCreateConsortium should be called once');

        getExtensionMock.restore();
      }).timeout(10000);

      it('for Ethereum Test Network destination.', async () => {
        // Arrange
        let validationMessageConsortiumName;
        let validationMessageConsortiumUrl;

        showInputBoxMock.twice();
        showInputBoxMock.onCall(0).callsFake(async (..._args: any[]) => {
          validationMessageConsortiumName = await _args[0].validateInput(defaultConsortiumName);
          return defaultConsortiumName;
        });
        showInputBoxMock.onCall(1).callsFake(async (..._args: any[]) => {
          validationMessageConsortiumUrl = await _args[0].validateInput(defaultConsortiumUrl);
          return defaultConsortiumUrl;
        });

        showQuickPickMock.callsFake(async (...args: any[]) => {
          const destination = args[0].find((x: any) => x.itemType === ItemType.ETHEREUM_TEST_NETWORK);
          selectedDestination = destination;
          selectedDestination.cmd = sinon.spy(destination.cmd);

          return selectedDestination;
        });

        // Act
        const result = await consortiumCommandsRewire.ConsortiumCommands
          .connectConsortium(new consortiumTreeManager.ConsortiumTreeManager());

        // Assert
        assertAfterEachTest(
          result, ItemType.ETHEREUM_TEST_CONSORTIUM, Constants.contextValue.consortium, defaultConsortiumName);
        assert.strictEqual(startGanacheCmdStub.notCalled, true, 'startGanache command should not be called');
        assert.strictEqual(result.urls[0].origin, defaultConsortiumUrl, 'returned result should store correct url');
        assert.strictEqual(
          validationMessageConsortiumName,
          undefined,
          'validationMessage for ConsortiumName should be undefined');
        assert.strictEqual(
          validationMessageConsortiumUrl,
          null,
          'validationMessage for ConsortiumUrl should be null');
      }).timeout(10000);

      it('for Ethereum Main Network destination.', async () => {
        // Arrange
        let validationMessageConsortiumName;
        let validationMessageConsortiumUrl;

        showInputBoxMock.twice();
        showInputBoxMock.onCall(0).callsFake(async (..._args: any[]) => {
          validationMessageConsortiumName = await _args[0].validateInput(defaultConsortiumName);
          return defaultConsortiumName;
        });
        showInputBoxMock.onCall(1).callsFake(async (..._args: any[]) => {
          validationMessageConsortiumUrl = await _args[0].validateInput(defaultConsortiumUrl);
          return defaultConsortiumUrl;
        });

        showQuickPickMock.callsFake(async (...args: any[]) => {
          const destination = args[0].find((x: any) => x.itemType === ItemType.ETHEREUM_MAIN_NETWORK);
          selectedDestination = destination;
          selectedDestination.cmd = sinon.spy(destination.cmd);

          return selectedDestination;
        });

        // Act
        const result = await consortiumCommandsRewire.ConsortiumCommands
          .connectConsortium(new consortiumTreeManager.ConsortiumTreeManager());

        // Assert
        assertAfterEachTest(
          result, ItemType.ETHEREUM_MAIN_CONSORTIUM, Constants.contextValue.consortium, defaultConsortiumName);
        assert.strictEqual(startGanacheCmdStub.notCalled, true, 'startGanache command should not be called');
        assert.strictEqual(result.urls[0].origin, defaultConsortiumUrl, 'returned result should store correct url');
        assert.strictEqual(
          validationMessageConsortiumName,
          undefined,
          'validationMessage for ConsortiumName should be undefined');
        assert.strictEqual(
          validationMessageConsortiumUrl,
          null,
          'validationMessage for ConsortiumUrl should be null');
      }).timeout(10000);
    });
  });
});
