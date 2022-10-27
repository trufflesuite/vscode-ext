// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import assert from 'assert';
import sinon from 'sinon';
import * as vscode from 'vscode';
import {getTruffleWorkspace, getWorkspaceRoot} from '@/helpers/workspace';

describe('workspace', () => {
  const testWorkspaceFolder: any[] = [
    {
      uri: {
        fsPath: 'testPath1',
      },
    },
    {
      uri: {
        fsPath: 'testPath2',
      },
    },
  ];

  let workspaceMock: sinon.SinonStub<any[], any>;

  beforeEach(() => {
    workspaceMock = sinon.stub(vscode.workspace, 'workspaceFolders');
  });

  afterEach(() => {
    workspaceMock.restore();
  });

  describe('getWorkspaceRoot', () => {
    it('should throw exception when no workspace is opened', () => {
      // Arrange
      workspaceMock.value(undefined);

      // Act and assert
      assert.throws(getWorkspaceRoot, /Workspace root should be defined/);
    });

    it('should throw exception when workspace is empty', () => {
      // Arrange
      workspaceMock.value([]);

      // Act and assert
      assert.throws(getWorkspaceRoot, /Workspace root should be defined/);
    });

    it('should return `undefined` when no workspace is opened and has `ignoreException`', () => {
      // Arrange
      workspaceMock.value(undefined);

      // Act
      const result = getWorkspaceRoot(true);

      // Assert
      assert.strictEqual(result, undefined);
    });

    it('should return `undefined` when workspace is empty and has `ignoreException`', () => {
      // Arrange
      workspaceMock.value([]);

      // Act
      const result = getWorkspaceRoot(true);

      // Assert
      assert.strictEqual(result, undefined);
    });

    it('should return the first workspace root path', async () => {
      // Arrange
      workspaceMock.value(testWorkspaceFolder);

      // Act
      const result = getWorkspaceRoot();

      // Assert
      assert.strictEqual(result, testWorkspaceFolder[0].uri.fsPath);
    });
  });

  describe('getTruffleWorkspace', () => {
    it('should reject when no workspace is opened', () => {
      // Arrange
      workspaceMock.value(undefined);

      // Act and assert
      assert.rejects(getTruffleWorkspace, /Workspace root should be defined/);
    });

    it('should reject when workspace is empty', () => {
      // Arrange
      workspaceMock.value([]);

      // Act and assert
      assert.rejects(getTruffleWorkspace, /Workspace root should be defined/);
    });
  });
});
