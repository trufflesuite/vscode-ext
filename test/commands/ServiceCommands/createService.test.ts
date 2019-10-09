// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as assert from 'assert';
import rewire = require('rewire');
import * as sinon from 'sinon';
import { QuickPickOptions } from 'vscode';
import { Constants } from '../../../src/Constants';
import * as helpers from '../../../src/helpers';
import { ItemType } from '../../../src/Models';
import { LocalProject, LocalService } from '../../../src/Models/TreeItems';
import { TreeManager } from '../../../src/services';

describe('Create Service', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('showQuickPick should be executed with Constants.placeholders.selectDestination placeholder',
    async () => {
      // Arrange
      const serviceCommandsRewire = rewire('../../../src/commands/ServiceCommands');
      const showQuickPickStub = sinon.stub();
      showQuickPickStub
        .returns({
          cmd: sinon.mock().returns(new LocalProject('label', 8545)),
          itemType: ItemType.AZURE_BLOCKCHAIN_SERVICE,
          label: Constants.treeItemData.service.azure.label,
        });

      sinon.stub(TreeManager, 'getItem').returns(new LocalService());
      sinon.replace(helpers, 'showQuickPick', showQuickPickStub);

      // Act
      await serviceCommandsRewire.ServiceCommands.createProject();

      // Assert
      assert.strictEqual(
        (showQuickPickStub.getCall(0).args[1] as QuickPickOptions).placeHolder,
        `${Constants.placeholders.selectDestination}.`,
        'showQuickPick should be called with given arguments',
      );
    });
});
