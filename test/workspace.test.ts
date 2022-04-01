// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import assert from "assert";
import sinon from "sinon";
import vscode from "vscode";
import {Constants} from "../src/Constants";
import * as workspaceHelper from "../src/helpers/workspace";

describe("Workspace", () => {
  describe("Unit test", () => {
    const testWorkspaceFolder: any[] = [
      {
        uri: {
          fsPath: "testPath1",
        },
      },
      {
        uri: {
          fsPath: "testPath2",
        },
      },
    ];
    let workspaceMock: sinon.SinonStub<any[], any>;

    beforeEach(() => {
      workspaceMock = sinon.stub(vscode.workspace, "workspaceFolders");
    });

    afterEach(() => {
      workspaceMock.restore();
    });

    it("getWorkspaceRoot should throw exception when no workspace opened", () => {
      // Arrange
      workspaceMock.value(undefined);

      // Act and assert
      assert.throws(
        () => workspaceHelper.getWorkspaceRoot(),
        Error,
        Constants.errorMessageStrings.VariableShouldBeDefined("Workspace root")
      );
    });

    it("getWorkspaceRoot should return workspace root path", async () => {
      // Arrange
      workspaceMock.value(testWorkspaceFolder);

      // Act
      const result = workspaceHelper.getWorkspaceRoot();

      // Assert
      assert.strictEqual(result, testWorkspaceFolder[0].uri.fsPath);
    });

    it("isWorkspaceOpen should return false when no workspace opened", () => {
      // Arrange
      workspaceMock.value(undefined);

      // Act
      const result = workspaceHelper.isWorkspaceOpen();

      // Assert
      assert.strictEqual(result, false);
    });

    it("isWorkspaceOpen should return true when workspace opened", () => {
      // Arrange
      workspaceMock.value(testWorkspaceFolder);

      // Act
      const result = workspaceHelper.isWorkspaceOpen();

      // Assert
      assert.strictEqual(result, true);
    });
  });
});
