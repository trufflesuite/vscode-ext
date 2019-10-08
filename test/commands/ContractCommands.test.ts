// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as assert from 'assert';
import * as path from 'path';
import rewire = require('rewire');
import * as sinon from 'sinon';
import { commands, ExtensionContext, Uri, window } from 'vscode';
import { ContractCommands } from '../../src/commands';
import { Constants } from '../../src/Constants';
import { CancellationEvent } from '../../src/Models';
import * as contractUI from '../../src/pages/ContractUI';
import { ContractDB, ContractInstanceWithMetadata } from '../../src/services';
import { Contract } from '../../src/services/contract/Contract';
import { Network } from '../../src/services/contract/Network';

describe('ContractCommands tests', () => {
  const fileUri = {
    fsPath: path.join(__dirname, 'testData', 'TestContract.json'),
  } as Uri;

  const contractInstance = new ContractInstanceWithMetadata(
    new Contract({
      contractName: 'contractName',
      networks: [{}],
      updatedAt: '01-01-2019',
    }),
    { id: 'testnetwork' } as Network,
    null,
  );

  afterEach(() => {
    sinon.restore();
  });

  it('showSmartContractPage throws error when contract does not exist and deploy can`t create contract', async () => {
    // Arrange
    sinon.stub(ContractDB, 'getContractInstances').returns(Promise.resolve([]));
    sinon.stub(window, 'showWarningMessage').returns(Promise.resolve(undefined));

    // Act
    const action = async () => {
      await ContractCommands
        .showSmartContractPage({} as ExtensionContext, fileUri);
    };

    // Assert
    await assert.rejects(
      action,
      Error,
      Constants.errorMessageStrings.CompiledContractIsMissing);
  });

  it('showSmartContractPage throws cancellationEvent when contract does not exist and deploy can create contract, ' +
    'but user click cancel button',
    async () => {
      // Arrange
      sinon.stub(ContractDB, 'getContractInstances').returns(Promise.resolve([]));
      sinon.stub(window, 'showWarningMessage')
        .returns(Promise.resolve({ title: Constants.informationMessage.cancelButton }));

      // Act
      const action = async () => {
        await ContractCommands
          .showSmartContractPage({} as ExtensionContext, fileUri);
      };

      // Assert
      await assert.rejects(action, CancellationEvent);
    });

  it('showSmartContractPage executes deploy contract when contract does not exist, deploy can create contract ' +
    'and user click deploy button',
    async () => {
      // Arrange
      sinon.stub(ContractDB, 'getContractInstances')
        .onCall(0)
          .returns(Promise.resolve([]))
        .onCall(1)
          .returns(Promise.resolve([
            contractInstance,
          ]));
      sinon.replace(
        window,
        'showWarningMessage',
        sinon.stub().returns(Promise.resolve(Constants.informationMessage.deployButton)),
      );
      const executeCommandSpy = sinon.stub(commands, 'executeCommand').callsFake(() => Promise.resolve());
      sinon.stub(contractUI, 'ContractUI').returns({
        postMessage: () => undefined,
        show: () => undefined,
      });

      // Act
      await ContractCommands
        .showSmartContractPage({} as ExtensionContext, fileUri);

      // Assert
      assert.strictEqual(executeCommandSpy.calledOnce, true, 'showSmartContract should execute deploy contract');
    });

  it('showSmartContractPage throws error when contract exist without networks and deploy can`t create contract',
    async () => {
      // Arrange
      sinon.stub(ContractDB, 'getContractInstances')
        .onCall(0)
          .returns(Promise.resolve([]))
        .onCall(1)
          .returns(Promise.resolve([
            contractInstance,
          ]));
      sinon.replace(
        window,
        'showWarningMessage',
        sinon.stub().returns(Promise.resolve(Constants.informationMessage.deployButton)),
      );
      sinon.stub(commands, 'executeCommand').callsFake(() => Promise.resolve());

      // Act
      const action = async () => {
        await ContractCommands
          .showSmartContractPage({} as ExtensionContext, fileUri);
      };

      // Assert
      await assert.rejects(
        action,
        Error,
        Constants.errorMessageStrings.CompiledContractIsMissing);
    });

  it('showSmartContractPage should show page for contract', async () => {
    // Arrange
    sinon.stub(ContractDB, 'getContractInstances')
      .returns(Promise.resolve([
        contractInstance,
      ]));
    const contractCommandsRewire = rewire('../../src/commands/ContractCommands');
    const showStub = sinon.stub().returns(() => undefined);
    sinon.stub(contractUI, 'ContractUI').returns({
      show: showStub,
    });

    // Act
    await contractCommandsRewire.ContractCommands
      .showSmartContractPage({} as ExtensionContext, fileUri);

    // Assert
    assert.strictEqual(showStub.calledOnce, true, 'showSmartContractPage should create drizzle page');
  });
});
