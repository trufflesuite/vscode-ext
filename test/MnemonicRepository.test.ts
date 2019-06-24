// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as sinon from 'sinon';
import uuid = require('uuid');
import { Memento } from 'vscode';
import { Constants } from '../src/Constants';
import { MnemonicRepository } from '../src/MnemonicService/MnemonicRepository';
import { FakeExtensionState } from './FakeExtensionState';
import { TestConstants } from './TestConstants';

describe('MnemonicRepository', () => {
  describe('Unit test', () => {
    let readFileSyncMock: any;
    let existsSyncMock: any;
    let globalState: Memento;

    beforeEach(() => {
      readFileSyncMock = sinon.stub(fs, 'readFileSync');
      existsSyncMock = sinon.stub(fs, 'existsSync');

      // Clean state before run test
      globalState = new FakeExtensionState({});
      MnemonicRepository.initialize(globalState);
    });

    afterEach(() => {
      sinon.restore();

      // Clean state after run test
      globalState = new FakeExtensionState({});
      MnemonicRepository.initialize(globalState);
    });

    const separators: string [] = [' ', os.EOL, '   '];
    const trimmedString = uuid.v4();
    let testString = trimmedString;

    separators.forEach((element, index) => {
      it(`GetMnemonic should return trimmed content ${index + 1}`, () => {
        // Arrange
        const filePath = uuid.v4();
        testString = `${element}${testString}${element}`;

        readFileSyncMock.returns(testString);

        // Act
        const result = MnemonicRepository.getMnemonic(filePath);

        // Assert
        assert.strictEqual(result, trimmedString);
        assert.strictEqual(readFileSyncMock.calledOnce, true);
      });
    });

    it('GetMnemonic should throw exception when file not exists', () => {
      // Arrange
      const filePath = uuid.v4();
      readFileSyncMock.throws(TestConstants.testError);

      // Act
      try {
        MnemonicRepository.getMnemonic(filePath);
        assert.fail(TestConstants.testShouldThrowError);
      } catch (error) {
        // Assert
        assert.strictEqual(error.name, TestConstants.testError);
      }
    });

    it('GetAllMnemonicPaths should return correct paths', () => {
      // Arrange
      const storage: string[] = [uuid.v4(), uuid.v4(), uuid.v4()];
      globalState.update(Constants.mnemonicConstants.mnemonicStorage, storage);

      // Act
      const result = MnemonicRepository.getAllMnemonicPaths();

      // Assert
      assert.strictEqual(result.length, storage.length);
      assert.deepEqual(result, storage);
    });

    it('getExistedMnemonicPaths should return existing paths', () => {
      // Arrange
      const storage: string[] = [uuid.v4(), uuid.v4(), uuid.v4()];
      globalState.update(Constants.mnemonicConstants.mnemonicStorage, storage);
      existsSyncMock.onCall(0).callsFake(() => true);
      existsSyncMock.onCall(1).callsFake(() => false);
      existsSyncMock.onCall(2).callsFake(() => true);

      // Act
      const result = MnemonicRepository.getExistedMnemonicPaths();

      // Assert
      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0], storage[0]);
      assert.strictEqual(result[1], storage[2]);
    });

    it('saveMnemonicPath should update global state', () => {
      // Arrange
      const filePath = uuid.v4();

      // Act
      MnemonicRepository.saveMnemonicPath(filePath);

      const result = globalState.get<string[]>(Constants.mnemonicConstants.mnemonicStorage) as string[];

      // Assert
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0], filePath);
    });

    it('MaskMnemonic should return short label', () => {
      // Arrange
      const expectedResult = 'tes ... est';

      // Act
      const result = MnemonicRepository.MaskMnemonic(TestConstants.testMnemonic);

      // Assert
      assert.notStrictEqual(result, TestConstants.testMnemonic);
      assert.strictEqual(result, expectedResult);
    });

    it('MaskMnemonic should return default place holder', () => {
      // Act
      const result = MnemonicRepository.MaskMnemonic('');

      // Assert
      assert.strictEqual(result, Constants.placeholders.emptyLineText);
    });

    it('MaskMnemonic should return short label when mnemonic is short', () => {
      // Arrange
      const expectedResult = 'abc ... abc';

      // Act
      const result = MnemonicRepository.MaskMnemonic('abc');

      // Assert
      assert.strictEqual(result, expectedResult);
    });
  });
});
