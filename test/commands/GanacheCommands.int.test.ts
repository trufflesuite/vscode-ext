// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import assert from 'assert';
import cp, {ChildProcess} from 'child_process';
import rp from 'request-promise';
import sinon from 'sinon';
import stream from 'stream';
import vscode from 'vscode';
import {GanacheCommands} from '../../src/commands';
import * as commands from '../../src/helpers/command';
import * as shell from '../../src/helpers/shell';
import {IExtensionItem, LocalProject, LocalService, Service, TLocalProjectOptions} from '../../src/Models/TreeItems';
import {TreeManager} from '../../src/services';
import {ProjectView} from '../../src/ViewItems';

describe('Integration tests GanacheCommands', () => {
  const defaultPort = 8545;
  let getItemsMock: sinon.SinonStub<[], IExtensionItem[]>;
  let serviceItems: Service[];
  let loadStateMock: sinon.SinonStub<[], IExtensionItem[]>;
  let projectView: ProjectView;

  const description = '';

  const options: TLocalProjectOptions = {
    isForked: false,
    forkedNetwork: '',
    blockNumber: 0,
    url: '',
  };

  const streamMock = {
    on(_event: 'data', _listener: (chunk: any) => void): any {
      /* empty */
    },
  };
  const processMock = {
    on(_event: 'close', _listener: (code: number, signal: string) => void): any {
      /* empty */
    },
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
    serviceItems = await createTestServiceItems();
    getItemsMock = sinon.stub(TreeManager, 'getItems');
    getItemsMock.returns(serviceItems);
    loadStateMock = sinon.stub(TreeManager, 'loadState');
    loadStateMock.returns(serviceItems);

    projectView = new ProjectView(new LocalProject('test consortium', defaultPort, options, description));

    sinon.mock(vscode.window);
    sinon.stub(vscode.window, 'showInformationMessage');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('startGanacheCmd should execute npx cmd', async () => {
    // Arrange
    nodeVersion = 'v16.4.0';
    const spawnStub = sinon.stub(cp, 'spawn').returns(processMock as ChildProcess);
    sinon.stub(shell, 'findPid').resolves(Number.NaN);
    sinon.replace(commands, 'tryExecuteCommand', tryExecuteCommandFake);

    const response = {result: 'OK'};
    sinon.stub(rp, 'post').resolves(response);

    // Act
    await GanacheCommands.startGanacheCmd(() => Promise.resolve(projectView.extensionItem as LocalProject)).catch(
      (r) => {
        assert.fail(r);
      }
    );

    // Assert
    assert.strictEqual(spawnStub.called, true, 'should execute external command ');
    assert.strictEqual(spawnStub.getCall(0).args[0], 'npx', 'should execute npx command');
    assert.deepStrictEqual(
      spawnStub.getCall(0).args[1],
      ['ganache', `--port ${defaultPort}`],
      'should execute npx command with specific parameters'
    );
  });
});

async function createTestServiceItems(): Promise<Service[]> {
  const localService = new LocalService();
  return [localService];
}
