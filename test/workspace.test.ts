// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import assert from 'assert';
import sinon from 'sinon';
import * as vscode from 'vscode';
import {getWorkspaceRoot} from '@/helpers/workspace';

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

  it('`getWorkspaceRoot` should throw exception when no workspace opened', () => {
    // Arrange
    workspaceMock.value(undefined);

    // Act and assert
    assert.throws(getWorkspaceRoot, /Workspace root should be defined/);
  });

  it('`getWorkspaceRoot` should throw exception when workspace is empty', () => {
    // Arrange
    workspaceMock.value([]);

    // Act and assert
    assert.throws(getWorkspaceRoot, /Workspace root should be defined/);
  });

  it('`getWorkspaceRoot` should return `undefined` when no workspace opened and has `ignoreException`', () => {
    // Arrange
    workspaceMock.value(undefined);

    // Act
    const result = getWorkspaceRoot(true);

    // Assert
    assert.strictEqual(result, undefined);
  });

  it('`getWorkspaceRoot` should return `undefined` when workspace is empty and has `ignoreException`', () => {
    // Arrange
    workspaceMock.value([]);

    // Act
    const result = getWorkspaceRoot(true);

    // Assert
    assert.strictEqual(result, undefined);
  });

  it('`getWorkspaceRoot` should return the first workspace root path', async () => {
    // Arrange
    workspaceMock.value(testWorkspaceFolder);

    // Act
    const result = getWorkspaceRoot();

    // Assert
    assert.strictEqual(result, testWorkspaceFolder[0].uri.fsPath);
  });
});
