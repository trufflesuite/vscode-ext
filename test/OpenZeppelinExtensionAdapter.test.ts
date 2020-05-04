// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as assert from 'assert';
import * as semver from 'semver';
import * as sinon from 'sinon';
import * as uuid from 'uuid';
import { commands, extensions } from 'vscode';
import { OpenZeppelinExtensionAdapter } from '../src/services/extensionAdapter';

describe('sdkService', () => {
  let executeCommandMock: sinon.SinonStub<any>;
  let getExtensionMock: sinon.SinonStub<any>;
  let eqMock: sinon.SinonStub<any>;

  let openZeppelinExtensionAdapter: OpenZeppelinExtensionAdapter;

  beforeEach(() => {
    executeCommandMock = sinon.stub(commands, 'executeCommand');
    getExtensionMock = sinon.stub(extensions, 'getExtension');
    eqMock = sinon.stub(semver, 'eq');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('validateExtension', () => {
    it('should throw exception when extension not found', async () => {
      // Arrange
      getExtensionMock.returns(undefined);
      openZeppelinExtensionAdapter = new OpenZeppelinExtensionAdapter();

      // Act and assert
      assert.rejects(openZeppelinExtensionAdapter.validateExtension());
    });

    it('should throw exception when extension version not supported', async () => {
      // Arrange
      getExtensionMock.returns({
        isActive: true,
        packageJSON: {
          value: uuid.v4(),
        },
      });
      eqMock.returns(false);
      openZeppelinExtensionAdapter = new OpenZeppelinExtensionAdapter();

      // Act and assert
      assert.rejects(openZeppelinExtensionAdapter.validateExtension());
    });
  });

  describe('build', () => {
    it('should execute extension command', async () => {
      // Arrange
      getExtensionMock.returns({
        isActive: true,
        packageJSON: {
          value: uuid.v4(),
        },
      });
      openZeppelinExtensionAdapter = new OpenZeppelinExtensionAdapter();

      // Act
      await openZeppelinExtensionAdapter.build();

      // Assert
      assert.strictEqual(
        executeCommandMock.calledOnce,
        true,
        'executeCommand should called once',
      );
    });
  });

  describe('deploy', () => {
    it('should execute extension command', async () => {
      // Arrange
      getExtensionMock.returns({
        isActive: true,
        packageJSON: {
          value: uuid.v4(),
        },
      });
      openZeppelinExtensionAdapter = new OpenZeppelinExtensionAdapter();

      // Act
      await openZeppelinExtensionAdapter.deploy();

      // Assert
      assert.strictEqual(
        executeCommandMock.calledOnce,
        true,
        'executeCommand should called once',
      );
    });
  });
});
