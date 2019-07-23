// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as assert from 'assert';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as sinon from 'sinon';
import { TruffleConfiguration } from '../src/helpers';
import * as workspace from '../src/helpers/workspace';
import * as testData from './testData/truffleConfigTestdata';

describe('TruffleConfiguration helper', () => {

  afterEach(() => {
    sinon.restore();
  });

  it('generateMnemonic should return correct sequence',
    async () => {
      // Act
      const result = TruffleConfiguration.generateMnemonic();

      // Assert
      // 11 spaces + 12 words, 1 word = at least 1 char
      assert.strictEqual(result.length > 23, true, 'result length should be greater than 23');
      assert.strictEqual(result.split(' ').length, 12, 'number of words should be equal to 12');
    });

  it('getTruffleConfigUri returns correct value and check path for existence',
    async () => {
      // Arrange
      const referencePath = path.normalize('w:/temp/truffle-config.js');
      sinon.stub(workspace, 'getWorkspaceRoot').returns(path.normalize('w:/temp'));
      const pathExistsStub = sinon.stub(fs, 'pathExistsSync').returns(true);

      // Act
      const result = TruffleConfiguration.getTruffleConfigUri();

      // Assert
      assert.strictEqual(result, referencePath, 'result should be correct uri');
      assert.strictEqual(pathExistsStub.calledOnce, true, 'pathExists should called once');
    });

  it('getTruffleConfigUri throw an exception if path is not existed',
    async () => {
      // Arrange
      sinon.stub(workspace, 'getWorkspaceRoot').returns('');
      sinon.stub(fs, 'pathExistsSync').returns(false);

      // Act and Assert
      assert.throws(TruffleConfiguration.getTruffleConfigUri);
    });
});

describe('class TruffleConfig', () => {
  const configPathStub = path.normalize('w:/temp/truffle-config.js');
  let readFileStub: any;
  let writeFileStub: any;

  before(() => {
    readFileStub = sinon.stub(fs, 'readFileSync').returns(testData.referenceCfgContent);
    writeFileStub = sinon.stub(fs, 'writeFileSync');
  });

  after(() => {
    sinon.restore();
  });

  afterEach(() => {
    sinon.resetHistory();
  });

  it('getAST should load correct AST',
    async () => {
      // Arrange

      // Act
      const result = (new TruffleConfiguration.TruffleConfig(configPathStub)).getAST();

      // Assert
      assert.deepEqual(result, testData.referenceAstObject, 'result should be equal to expected result');
      assert.strictEqual(readFileStub.callCount > 0, true, 'readFile should called more then 0 times');
      assert.strictEqual(
        readFileStub.getCall(0).args[0],
        configPathStub,
        'readFile should called with correct arguments');
    });

  it('writeAST should write ast content to file',
    async () => {
      // Arrange

      // Act
      const truffleConfig = new TruffleConfiguration.TruffleConfig(configPathStub);
      truffleConfig.getAST();
      truffleConfig.writeAST();

      // Assert
      assert.strictEqual(writeFileStub.callCount > 0, true, 'writeFile should called more then 0 times');
      assert.strictEqual(
        writeFileStub.getCall(0).args[0],
        configPathStub,
        'writeFile should called with correct arguments');
      assert.strictEqual(// 60 - first line, to avoid EOL differences
        writeFileStub.getCall(0).args[1].substring(0, 60),
        testData.referenceCfgContent.substring(0, 60),
        'writeFile should called with correct arguments',
      );
    });

  it('getNetworks should returns correct networks',
    async () => {
      // Arrange
      const truffleConfig = new TruffleConfiguration.TruffleConfig(configPathStub);

      // Act
      const result = truffleConfig.getNetworks();

      // Assert
      assert.deepStrictEqual(
        result[0],
        testData.referenceConfiguration.networks[0],
        'result first item should be equal to expected network');
      assert.deepStrictEqual(
        result[1],
        testData.referenceConfiguration.networks[1],
        'result second item should be equal to expected network');
    });

  it('setNetworks should add a network item',
    async () => {
      // Arrange
      const truffleConfig = new TruffleConfiguration.TruffleConfig(configPathStub);
      const newNetwork = {
        name: 'newNetworkName',
        options: {
          consortium_id: 456,
          network_id: 'ntwrk',
        },
      };

      // Act
      const resultBefore = truffleConfig.getNetworks();
      truffleConfig.setNetworks(newNetwork);
      const resultAfter = truffleConfig.getNetworks();

      // Assert
      assert.strictEqual(resultBefore.length, 2, 'before execution should be 2 networks');
      assert.strictEqual(resultAfter.length, 3, 'after execution should be 2 networks');
      assert.deepStrictEqual(resultAfter[2], newNetwork, 'last network should be equal to test network');
    });

  it('setNetworks should threw an exception if network already existed',
    async () => {
      // Arrange
      const truffleConfig = new TruffleConfiguration.TruffleConfig(configPathStub);
      const newNetwork = {
        name: 'development',
        options: {
          consortium_id: 456,
          network_id: 'ntwrk',
        },
      };
      const action = () => {
        truffleConfig.setNetworks(newNetwork);
      };

      // Act and Assert
      assert.throws(action);
    });

  it('importFs should add correct import line',
    async () => {
      // Arrange
      const truffleConfig = new TruffleConfiguration.TruffleConfig(configPathStub);

      // Act
      truffleConfig.importPackage('fs', 'fs');

      // Assert
      const configContent = writeFileStub.getCall(0).args[1];
      assert.strictEqual(
        configContent.includes('fs = require(\'fs\');'),
        true,
        'configContent should include test string');
    });
});

describe('getConfiguration() in class TruffleConfig', () => {
  const configPathStub = path.normalize('w:/temp/truffle-config.js');

  afterEach(() => {
    sinon.restore();
  });

  it('getConfiguration returns default configuration',
    async () => {
      // Arrange
      sinon.stub(fs, 'readFileSync').returns('');
      const truffleConfig = new TruffleConfiguration.TruffleConfig(configPathStub);

      // Act
      const result = truffleConfig.getConfiguration();

      // Assert
      assert.strictEqual(
        result.contracts_build_directory,
        path.normalize('build/contracts'),
        'result should contain contracts build directory');
      assert.strictEqual(
        result.contracts_directory,
        'contracts',
        'result should contain contracts directory');
      assert.strictEqual(
        result.migrations_directory,
        'migrations',
        'result should contain migration build directory');
      assert.deepStrictEqual(result.networks, undefined, 'result.networks should be undefined');
    });

  it('getConfiguration returns configuration without required fields',
    async () => {
      // Arrange
      sinon.stub(fs, 'readFileSync').returns(testData.referenceCfgContent);
      const truffleConfig = new TruffleConfiguration.TruffleConfig(configPathStub);

      // Act
      const result = truffleConfig.getConfiguration();

      // Assert
      assert.strictEqual(
        result.contracts_build_directory,
        path.normalize('build/contracts'),
        'result should contain contracts build directory');
      assert.strictEqual(
        result.contracts_directory,
        'contracts',
        'result should contain contracts directory');
      assert.strictEqual(
        result.migrations_directory,
        'migrations',
        'result should contain migration build directory');
      assert.deepStrictEqual(
        result.networks,
        testData.referenceConfiguration.networks,
        'result.networks should be equal to test networks');
    });

  it('getConfiguration returns configuration with required fields',
    async () => {
      // Arrange
      sinon.stub(fs, 'readFileSync').returns(testData.referenceCfgContentWithDirectories);
      const truffleConfig = new TruffleConfiguration.TruffleConfig(configPathStub);

      // Act
      const result = truffleConfig.getConfiguration();

      // Assert
      assert.strictEqual(
        result.contracts_build_directory,
        'build',
        'result should contain contracts build directory');
      assert.strictEqual(
        result.contracts_directory,
        'test_contracts',
        'result should contain contracts test_contracts directory');
      assert.strictEqual(
        result.migrations_directory,
        'test_migrations',
        'result should contain contracts test_migrations directory');
      assert.deepStrictEqual(
        result.networks,
        testData.referenceConfiguration.networks,
        'result.networks should be equal to test networks');
    });
});
