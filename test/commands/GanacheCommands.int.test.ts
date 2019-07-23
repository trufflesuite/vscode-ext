// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as assert from 'assert';
import * as cp from 'child_process';
import * as rp from 'request-promise';
import * as sinon from 'sinon';
import * as stream from 'stream';
import { ExtensionContext } from 'vscode';
import { GanacheCommands } from '../../src/commands/GanacheCommands';
import * as commands from '../../src/helpers/command';
import * as shell from '../../src/helpers/shell';
import { IExtensionItem, ItemType, LocalNetworkConsortium, Network } from '../../src/Models';
import { ConsortiumTreeManager } from '../../src/treeService/ConsortiumTreeManager';
import { ConsortiumView } from '../../src/ViewItems';
import { TestConstants } from '../TestConstants';

describe('Integration tests GanacheCommands', () => {
  const defaultPort = 8545;
  let consortiumTreeManager: ConsortiumTreeManager;
  let getItemsMock: sinon.SinonStub<[(boolean | undefined)?], IExtensionItem[]>;
  let testConsortiumItems: Network[];
  let loadStateMock: sinon.SinonStub<[], IExtensionItem[]>;
  let consortiumView: ConsortiumView;
  const streamMock = {
    on(_event: 'data', _listener: (chunk: any) => void): any { /* empty */ },
  };
  const processMock = {
    on(_event: 'close', _listener: (code: number, signal: string) => void): any { /* empty */ },
    stderr: streamMock as stream.Readable,
    stdout: streamMock as stream.Readable,
  };
  let nodeVersion = '';
  const tryExecuteCommandFake = async () => {
    return {
      cmdOutput: nodeVersion,
      cmdOutputIncludingStderr: '',
      code: 0,
    } as commands.ICommandResult;
  };

  before(async () => {
    testConsortiumItems = await createTestConsortiumItems();
    getItemsMock = sinon.stub(ConsortiumTreeManager.prototype, 'getItems');
    getItemsMock.returns(testConsortiumItems);
    loadStateMock = sinon.stub(ConsortiumTreeManager.prototype, 'loadState');
    loadStateMock.returns(testConsortiumItems);

    consortiumView = new ConsortiumView(
      new LocalNetworkConsortium('test consortium', `http://microsoft.com:${defaultPort}`),
    );
    consortiumTreeManager = new ConsortiumTreeManager({} as ExtensionContext);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('startGanacheCmd should execute npx cmd',
    async () => {
      // Arrange
      nodeVersion = 'v10.15.0';
      const spawnStub = sinon.stub(cp, 'spawn').returns(processMock as cp.ChildProcess);
      sinon.stub(shell, 'findPid').resolves(Number.NaN);
      sinon.replace(commands, 'tryExecuteCommand', tryExecuteCommandFake);

      const response = { result: 'OK' };
      sinon.stub(rp, 'post').resolves(response);

      // Act
      await GanacheCommands.startGanacheCmd(consortiumTreeManager, consortiumView);

      // Assert
      assert.strictEqual(spawnStub.called, true, 'should execute external command ');
      assert.strictEqual(spawnStub.getCall(0).args[0], 'npx', 'should execute npx command');
      assert.deepStrictEqual(
        spawnStub.getCall(0).args[1],
        ['ganache-cli', `-p ${defaultPort}`],
        'should execute npx command with specific parameters',
      );
    });
});

async function createTestConsortiumItems(): Promise<Network[]> {
  const networks: Network[] = [];

  const azureNetwork = new Network(TestConstants.networksNames.azureBlockchainService, ItemType.AZURE_BLOCKCHAIN);
  const localNetwork = new Network(TestConstants.networksNames.localNetwork, ItemType.LOCAL_NETWORK);
  const ethereumTestnet = new Network(TestConstants.networksNames.ethereumTestnet, ItemType.ETHEREUM_TEST_NETWORK);
  const ethereumNetwork = new Network(TestConstants.networksNames.ethereumNetwork, ItemType.ETHEREUM_MAIN_NETWORK);

  networks.push(azureNetwork, localNetwork, ethereumNetwork, ethereumTestnet);

  return networks;
}
