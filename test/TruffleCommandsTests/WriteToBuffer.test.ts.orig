// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { TruffleCommands } from '../../src/commands/TruffleCommands';
import { Constants } from '../../src/Constants';

describe('TruffleCommands', () => {
  describe('Integration test', () => {
    describe('Success path', () => {
      const fileUri = {
        fsPath: path.join(__dirname, 'testData', 'TestContract.json'),
      } as vscode.Uri;

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

      it('writeAbiToBuffer should write correct aby to clipboard', async () => {
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
      const fileUri = {
        fsPath: path.join(__dirname, 'WriteToBuffer.test.ts'),
      } as vscode.Uri;

      it('writeBytecodeToBuffer throw error when uri is not JSON file', async () => {
        // Act and assert
        await assert.rejects(
          TruffleCommands.writeBytecodeToBuffer(fileUri),
          Error,
          Constants.errorMessageStrings.InvalidContract);
      });

      it('writeAbiToBuffer throw error when uri is not JSON file', async () => {
        // Act and assert
        await assert.rejects(
          TruffleCommands.writeAbiToBuffer(fileUri),
          Error,
          Constants.errorMessageStrings.InvalidContract);
      });
    });
  });
});
