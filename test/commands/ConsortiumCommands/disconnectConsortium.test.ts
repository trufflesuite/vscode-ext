// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as assert from 'assert';
import rewire = require('rewire');
import * as sinon from 'sinon';
import { GanacheService } from '../../../src/GanacheService/GanacheService';
import {
  IExtensionItem,
  LocalNetworkConsortium,
  MainNetworkConsortium,
} from '../../../src/Models';
import { ConsortiumTreeManager } from '../../../src/treeService/ConsortiumTreeManager';
import { ConsortiumView } from '../../../src/ViewItems/ConsortiumView';

describe('Disconnect Consortium', () => {
  const consortiumTreeManagerStub = {
    removeItem(_extensionItem: IExtensionItem): void { /* empty */ },
  };

  afterEach(() => {
    sinon.restore();
  });

  describe('DisconnectConsortium_ShouldStopGanacheServer_LocalNetworkConsortium', () => {
    const consortiums = [
      { consortiumInstance: new LocalNetworkConsortium('name', 'url'), executed: true },
      { consortiumInstance: new MainNetworkConsortium('name'), executed: false },
    ];

    consortiums.forEach(async (consortium) => {
      it('GanacheService.stopGanacheServer() should be executed only for LocalNetworkConsortium.',
        async () => {
          // Arrange
          const consortiumCommandsRewire = rewire('../../../src/commands/ConsortiumCommands');
          const consortiumView = new ConsortiumView(consortium.consortiumInstance);
          const stopGanacheServerStub = sinon.stub(GanacheService, 'stopGanacheServer');

          // Act
          await consortiumCommandsRewire.ConsortiumCommands.disconnectConsortium(
            (consortiumTreeManagerStub as ConsortiumTreeManager),
            consortiumView,
          );

          // Assert
          assert.strictEqual(stopGanacheServerStub.calledOnce, consortium.executed);
        });
    });
  });

  describe('DisconnectConsortium_ShouldRemoveItem', () => {
    it('consortiumTreeManager.removeItem() should not be executed with IExtensionItem object from viewItem',
        async () => {
          // Arrange
          const consortiumCommandsRewire = rewire('../../../src/commands/ConsortiumCommands');
          const consortiumView = new ConsortiumView(new MainNetworkConsortium('name'));
          const spy = sinon.spy(consortiumTreeManagerStub, 'removeItem');

          // Act
          await consortiumCommandsRewire.ConsortiumCommands.disconnectConsortium(
            (consortiumTreeManagerStub as ConsortiumTreeManager),
            consortiumView,
          );

          // Assert
          assert.strictEqual(spy.calledOnce, true);
        });
      });
});
