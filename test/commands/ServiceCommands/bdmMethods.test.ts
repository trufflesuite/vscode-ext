// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as assert from 'assert';
import rewire = require('rewire');
import * as sinon from 'sinon';
import uuid = require('uuid');
import { extensions } from 'vscode';
import * as helpers from '../../../src/helpers';
import { ItemType } from '../../../src/Models';
import { BlockchainDataManagerNetworkNode, BlockchainDataManagerProject } from '../../../src/Models/TreeItems';
import { BlockchainDataManagerResourceExplorer } from '../../../src/resourceExplorers/BlockchainDataManagerResourceExplorer';
import { TreeManager } from '../../../src/services/tree/TreeManager';
import { NetworkNodeView } from '../../../src/ViewItems/NetworkNodeView';
import { ProjectView } from '../../../src/ViewItems/ProjectView';
import { AzureAccountHelper } from '../../testHelpers/AzureAccountHelper';

describe('BDM methods', () => {
  beforeEach(() => {
    sinon.stub(extensions, 'getExtension').returns(AzureAccountHelper.mockExtension);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('deleteBDMApplication should delete BDM application and all dependent resources', async () => {
    // Arrange
    const serviceCommandsRewire = rewire('../../../src/commands/ServiceCommands');
    const deleteBDMApplicationStub =
      sinon.stub(BlockchainDataManagerResourceExplorer.prototype, 'deleteBDMApplication');

    const blockchainDataManagerProject = new BlockchainDataManagerProject(uuid.v4(), uuid.v4(), uuid.v4());
    const blockchainDataManagerNetworkNode = new BlockchainDataManagerNetworkNode(
      uuid.v4(),
      uuid.v4(),
      uuid.v4(),
      uuid.v4(),
      [],
      ItemType.BLOCKCHAIN_DATA_MANAGER_APPLICATION,
      uuid.v4());

    blockchainDataManagerNetworkNode.addParent(blockchainDataManagerProject);
    const networkNodeView = new NetworkNodeView(blockchainDataManagerNetworkNode);

    // Act
    await serviceCommandsRewire.ServiceCommands.deleteBDMApplication(networkNodeView);

    // Assert
    assert.strictEqual(deleteBDMApplicationStub.calledOnce, true, 'deleteBDMApplication should be called.');
  });

  it('createNewBDMApplication should call all methods when we click on tree item', async () => {
    // Arrange
    const serviceCommandsRewire = rewire('../../../src/commands/ServiceCommands');
    const createNewBDMApplicationStub =
      sinon.stub(BlockchainDataManagerResourceExplorer.prototype, 'createNewBDMApplication');

    const getItemStub = sinon.stub(TreeManager, 'getItem');
    const showQuickPickStub = sinon.stub(helpers, 'showQuickPick');

    const blockchainDataManagerProject = new BlockchainDataManagerProject(uuid.v4(), uuid.v4(), uuid.v4());
    const networkNodeView = new ProjectView(blockchainDataManagerProject);

    // Act
    await serviceCommandsRewire.ServiceCommands.createNewBDMApplication(networkNodeView);

    // Assert
    assert.strictEqual(createNewBDMApplicationStub.calledOnce, true, 'createNewBDMApplication should be called.');
    assert.strictEqual(getItemStub.calledOnce, false, 'getItem should not be called.');
    assert.strictEqual(showQuickPickStub.calledOnce, false, 'showQuickPick should not be called.');
  });
});
