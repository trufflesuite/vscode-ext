// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { window } from 'vscode';
import { TruffleCommands } from '../../src/commands/TruffleCommands';
import { Constants } from '../../src/Constants';
import { vscodeEnvironment } from '../../src/helpers';
import { EnumStorage } from '../../src/Models';
import { ContractDB, ContractInstanceWithMetadata, ContractService } from '../../src/services';
import { Contract } from '../../src/services/contract/Contract';

describe('TruffleCommands', () => {
  const fileUri = {
    fsPath: path.join(__dirname, 'testData', 'TestContract.json'),
  } as vscode.Uri;

  describe('Integration test', () => {
    describe('Success path', () => {
      const testJson = fs.readFileSync(fileUri.fsPath, null);
      const testJsonString = JSON.parse(testJson.toString());

      it('writeBytecodeToBuffer should write correct bytecode to clipboard', async () => {
        // Arrange
        const testBytecode = testJsonString[Constants.contractProperties.bytecode];

        // Act
        await TruffleCommands.writeBytecodeToBuffer(fileUri);

        // Assert
        assert.strictEqual(
          await vscode.env.clipboard.readText(),
          testBytecode,
          'clipboard should store correct bytecode');
      });

      it('writeAbiToBuffer should write correct abi to clipboard', async () => {
        // Arrange
        const testAbi = JSON.stringify(testJsonString[Constants.contractProperties.abi]);

        // Act
        await TruffleCommands.writeAbiToBuffer(fileUri);

        // Assert
        assert.strictEqual(
          await vscode.env.clipboard.readText(),
          testAbi,
          'clipboard should store correct aby');
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
          Constants.errorMessageStrings.InvalidContract);
      });

      it('writeAbiToBuffer throw error when uri is not JSON file', async () => {
        // Act and assert
        await assert.rejects(
          TruffleCommands.writeAbiToBuffer(invalidFileUri),
          Error,
          Constants.errorMessageStrings.InvalidContract);
      });
    });
  });

  describe('Unit test', () => {
    it('writeDeployedBytecodeToBuffer should complete basic pipeline', async () => {
      // Arrange
      const mockContractInstance = {
        id: '',
        // tslint:disable-next-line: object-literal-sort-keys
        contract: {} as Contract,
        contractName: '',
        updateDate: '',
        enumsInfo: new EnumStorage(),
        provider: { host: 'test' },
        network: { id: '', name: 'networkName' },
        address: 'contractAddress',
      } as ContractInstanceWithMetadata;
      const mockContracts = [ mockContractInstance ];
      const selectedNetworkName = mockContractInstance.network.name;

      sinon.stub(ContractDB, 'getContractInstances').resolves(mockContracts);
      sinon.stub(window, 'showQuickPick').callsFake(async (...args: any[]) => {
        return args[0].find((arg: any) => arg.label === selectedNetworkName);
      });

      const writeToClipboardStub = sinon.stub(vscodeEnvironment, 'writeToClipboard').resolves();
      const getDeployedByteCodeByAddressStub = sinon.stub(ContractService, 'getDeployedBytecodeByAddress')
        .resolves('deployedByteCode');

      // Act
      await TruffleCommands.writeDeployedBytecodeToBuffer(fileUri);

      // Assert
      assert.strictEqual(getDeployedByteCodeByAddressStub
        .calledWithExactly(mockContractInstance.provider!.host, mockContractInstance.address!),
        true,
        'getContractDeployedBytecodeByAddress should be called with exact params');
      assert.strictEqual(writeToClipboardStub.called, true, 'writeToClipboard should be called');
    });
  });
});
