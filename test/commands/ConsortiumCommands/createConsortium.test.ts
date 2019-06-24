// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as assert from 'assert';
import rewire = require('rewire');
import * as sinon from 'sinon';
import { QuickPickOptions } from 'vscode';
import { Constants } from '../../../src/Constants';
import * as helpers from '../../../src/helpers';
import {
  IExtensionItem,
  Info,
  ItemType,
  Network,
} from '../../../src/Models';
import { ConsortiumTreeManager } from '../../../src/treeService/ConsortiumTreeManager';

describe('Create Consortium', () => {

  afterEach(() => {
    sinon.restore();
  });

  it('showQuickPick should be executed with Constants.placeholders.selectConsortium placeholder',
    async () => {
      // Arrange
      const consortiumCommandsRewire = rewire('../../../src/commands/ConsortiumCommands');
      const showQuickPickStub = sinon.stub();
      showQuickPickStub
        .returns({
          cmd: sinon.mock().returns(''),
          itemType: ItemType.AZURE_BLOCKCHAIN,
          label: Constants.uiCommandStrings.CreateConsortiumAzureBlockchainService,
        });
      consortiumCommandsRewire.__set__('getNetwork', sinon.mock().returns(new Info('label')));
      consortiumCommandsRewire.__set__('getConnectedAbsConsortiums', sinon.mock().returns([]));
      sinon.replace(helpers, 'showQuickPick', showQuickPickStub);

      // Act
      await consortiumCommandsRewire.ConsortiumCommands.createConsortium();

      // Assert
      assert.strictEqual(
        (showQuickPickStub.getCall(0).args[1] as QuickPickOptions).placeHolder,
        Constants.placeholders.selectConsortium,
      );
    });

  describe('getNetwork', () => {
    const consortiumCommandsRewire = rewire('../../../src/commands/ConsortiumCommands');
    sinon.replace(
      ConsortiumTreeManager.prototype,
      'getItem',
      sinon.stub().returns(Promise.resolve(undefined)),
    );
    const getNetwork = consortiumCommandsRewire.__get__('getNetwork');

    it('getNetwork should throw an error if no network found',
      async () => {
        // Arrange
        const consortiumTreeManagerStub = {
          getItem(_itemType: ItemType): IExtensionItem | undefined { return undefined; },
        };

        // Act and Assert
        await assert.rejects(
          getNetwork(
            consortiumTreeManagerStub as ConsortiumTreeManager,
            new Object() as ItemType,
          ));
      });

    it('getNetwork should not throw an error if network found',
      async () => {
        // Arrange
        const consortiumTreeManagerStub = {
          getItem(_itemType: ItemType): IExtensionItem | undefined {
            return new Network('network', ItemType.AZURE_BLOCKCHAIN);
          },
        };

        // Act and Assert
        await assert.doesNotReject(
          getNetwork(
            consortiumTreeManagerStub as ConsortiumTreeManager,
            new Object() as ItemType,
          ));
      });
  });
});
