// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import sinon from 'sinon';
import * as vscode from 'vscode';
import {window} from 'vscode';
import {TruffleCommands} from '@/commands';
import {Constants} from '@/Constants';
import * as vscodeEnvironment from '@/helpers/vscodeEnvironment';
import {EnumStorage} from '@/Models';
import {ContractDB, ContractInstanceWithMetadata, ContractService} from '@/services';
import {Contract} from '@/services/contract/Contract';

describe('TruffleCommands - Write To Buffer', () => {
  const fileUri = {
    fsPath: path.join(__dirname, 'testData', 'TestContract.json'),
  } as vscode.Uri;

  describe('Integration test', () => {
    describe('Success path', () => {
      const testJson = fs.readFileSync(fileUri.fsPath, null);
      const testJsonString = JSON.parse(testJson.toString());

      it('writeBytecodeToBuffer should write correct bytecode to clipboard', async () => {
        // Arrange
        const testBytecode = testJsonString[Constants.contract.configuration.properties.bytecode];

        // Act
        await TruffleCommands.writeBytecodeToBuffer(fileUri);

        // Assert
        assert.strictEqual(
          await vscode.env.clipboard.readText(),
          testBytecode,
          'clipboard should store correct bytecode'
        );
      });

      it('writeAbiToBuffer should write correct abi to clipboard', async () => {
        // Arrange
        const testAbi = JSON.stringify(testJsonString[Constants.contract.configuration.properties.abi]);

        // Act
        await TruffleCommands.writeAbiToBuffer(fileUri);

        // Assert
        assert.strictEqual(await vscode.env.clipboard.readText(), testAbi, 'clipboard should store correct aby');
      });
    });

    describe('Invalid cases', () => {
      const invalidFileUri = {
        fsPath: path.join(__dirname, 'WriteToBuffer.test.ts'),
      } as vscode.Uri;

      it('writeBytecodeToBuffer throw error when uri is not JSON file', async () => {
        // Act and assert
        await assert.rejects(
          TruffleCommands.writeBytecodeToBuffer(invalidFileUri),
          Error,
          Constants.errorMessageStrings.InvalidContract
        );
      });

      it('writeAbiToBuffer throw error when uri is not JSON file', async () => {
        // Act and assert
        await assert.rejects(
          TruffleCommands.writeAbiToBuffer(invalidFileUri),
          Error,
          Constants.errorMessageStrings.InvalidContract
        );
      });
    });
  });

  describe('Unit test', () => {
    it('writeDeployedBytecodeToBuffer should complete basic pipeline', async () => {
      // Arrange
      const mockContractInstance = {
        id: '',
        contract: {} as Contract,
        contractName: '',
        updateDate: '',
        enumsInfo: new EnumStorage(),
        provider: {host: 'test'},
        network: {id: '', name: 'networkName'},
        address: 'contractAddress',
      } as ContractInstanceWithMetadata;
      const mockContracts = [mockContractInstance];
      const selectedNetworkName = mockContractInstance.network.name;

      sinon.stub(ContractDB, 'getContractInstances').resolves(mockContracts);
      sinon
        .stub(window, 'showQuickPick')
        .callsFake(async function showQuickPick(
          items: readonly vscode.QuickPickItem[] | Thenable<readonly vscode.QuickPickItem[]>
        ) {
          if (items instanceof Array) {
            return items.find((arg: any) => arg.label === selectedNetworkName);
          }
          //
          return undefined;
        });

      const writeToClipboardStub = sinon.stub(vscodeEnvironment, 'writeToClipboard').resolves();
      const getDeployedByteCodeByAddressStub = sinon
        .stub(ContractService, 'getDeployedBytecodeByAddress')
        .resolves('deployedByteCode');

      // Act
      await TruffleCommands.writeDeployedBytecodeToBuffer(fileUri);

      // Assert
      assert.strictEqual(
        getDeployedByteCodeByAddressStub.calledWithExactly(
          mockContractInstance.provider!.host,
          mockContractInstance.address!
        ),
        true,
        'getContractDeployedBytecodeByAddress should be called with exact params'
      );
      assert.strictEqual(writeToClipboardStub.called, true, 'writeToClipboard should be called');
    });
  });
});
