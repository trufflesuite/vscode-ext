// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import assert from "assert";
import fs from "fs";
import sinon from "sinon";
import uuid from "uuid";
import {InputBoxOptions, QuickPickItem, QuickPickOptions, Uri, window, workspace, WorkspaceConfiguration} from "vscode";
import {Constants} from "../src/Constants";
import * as userInteraction from "../src/helpers/userInteraction";
import {CancellationEvent} from "../src/Models";

interface ITestItems extends QuickPickItem {
  id: number;
  label: string;
  description: string;
  testProperty: string;
}

describe("User interaction test", () => {
  let windowMock: sinon.SinonMock;
  let getConfigurationMock: any;
  let withProgressMock: any;

  beforeEach(() => {
    windowMock = sinon.mock(window);
    getConfigurationMock = sinon.stub(workspace, "getConfiguration");
    withProgressMock = sinon.stub(window, "withProgress");
  });

  afterEach(() => {
    sinon.restore();
  });

  it("showInputBox should return a value", async () => {
    // Arrange
    const option: InputBoxOptions = {};

    windowMock.expects("showInputBox").withArgs(option).returns("test");

    // Act
    const result = await userInteraction.showInputBox(option);

    // Assert
    assert.strictEqual(result, "test");
  });

  it("showInputBox should throw cancellation event", async () => {
    // Arrange
    const option: InputBoxOptions = {};

    windowMock.expects("showInputBox").withArgs(option).returns(undefined);

    // Act and assert
    await assert.rejects(userInteraction.showInputBox(option), CancellationEvent);
  });

  it("showQuickPick should return a value", async () => {
    // Arrange
    const option: QuickPickOptions = {};
    const items: QuickPickItem[] = [
      {
        description: "test 1",
        label: "test 1",
      },
      {
        description: "test 2",
        label: "test 2",
      },
    ];

    windowMock.expects("showQuickPick").withArgs(items, option).returns(items[1]);

    // Act
    const result = await userInteraction.showQuickPick(items, option);

    // Assert
    assert.deepStrictEqual(result, items[1]);
  });

  it("showQuickPick with custom items should return a value", async () => {
    // Arrange
    const option: QuickPickOptions = {};
    const items: ITestItems[] = [
      {
        description: "test 1",
        id: 1,
        label: "test 1",
        testProperty: "test 1",
      },
      {
        description: "test 2",
        id: 2,
        label: "test 2",
        testProperty: "test 2",
      },
    ];

    windowMock.expects("showQuickPick").withArgs(items, option).returns(items[1]);

    // Act
    const result = await userInteraction.showQuickPick(items, option);

    // Assert
    assert.deepStrictEqual(result, items[1]);
  });

  it("showQuickPick should throw cancellation event", async () => {
    // Arrange
    const option: QuickPickOptions = {};
    const items: QuickPickItem[] = [
      {
        description: "test 1",
        label: "test 1",
      },
      {
        description: "test 2",
        label: "test 2",
      },
    ];

    windowMock.expects("showQuickPick").withArgs(items, option).returns(undefined);

    // Act and assert
    await assert.rejects(userInteraction.showQuickPick(items, option), CancellationEvent);
  });

  it("showConfirmPaidOperationDialog should throw cancellation event if answer not yes", async () => {
    // Arrange
    const answer = "test";

    windowMock.expects("showInputBox").returns(answer);

    // Act and assert
    await assert.rejects(userInteraction.showConfirmPaidOperationDialog(), CancellationEvent);
  });

  it("showConfirmPaidOperationDialog should throw cancellation event if answer undefined", async () => {
    // Arrange
    windowMock.expects("showInputBox").returns(undefined);

    // Act and assert
    await assert.rejects(userInteraction.showConfirmPaidOperationDialog(), CancellationEvent);
  });

  it("showConfirmPaidOperationDialog should not throw cancellation event if answer yes", async () => {
    // Arrange
    const answer = Constants.confirmationDialogResult.yes;

    windowMock.expects("showInputBox").returns(answer);

    // Act and assert
    await userInteraction.showConfirmPaidOperationDialog();
  });

  it("showOpenFolderDialog should return a folder path", async () => {
    // Arrange
    const folderPath = "test/test";
    const uris: Uri[] = [{fsPath: folderPath} as Uri];

    windowMock.expects("showOpenDialog").returns(uris);

    // Act
    const result = await userInteraction.showOpenFolderDialog();

    // Assert
    assert.deepStrictEqual(result, folderPath);
  });

  it("showOpenFolderDialog should return path of first folder", async () => {
    // Arrange
    const folderPath1 = "test/test";
    const folderPath2 = "test2/test2";
    const uris: Uri[] = [{fsPath: folderPath1}, {fsPath: folderPath2}] as Uri[];

    windowMock.expects("showOpenDialog").returns(uris);

    // Act
    const result = await userInteraction.showOpenFolderDialog();

    // Assert
    assert.strictEqual(result, folderPath1);
  });

  it("showOpenFolderDialog should throw cancellation event if dialog canceled", async () => {
    // Arrange
    windowMock.expects("showOpenDialog").returns(undefined);

    // Act and assert
    await assert.rejects(userInteraction.showOpenFolderDialog(), CancellationEvent);
  });

  it("saveTextInFile should return file path", async () => {
    // Arrange
    const fsMock = sinon.mock(fs);
    const filePath = "filePath";
    const text = "test text";

    windowMock.expects("showSaveDialog").returns({fsPath: filePath} as Uri);
    fsMock.expects("writeFileSync");

    // Act
    const result = await userInteraction.saveTextInFile(text, filePath);

    // Assert
    assert.strictEqual(result, filePath);
  });

  it("saveTextInFile should throw cancellation event if dialog canceled", async () => {
    // Arrange
    const filePath = "filePath";
    const text = "test text";

    windowMock.expects("showSaveDialog").returns(undefined);

    // Act and assert
    await assert.rejects(userInteraction.saveTextInFile(text, filePath), CancellationEvent);
  });

  it("showIgnorableNotification should show notification", async () => {
    // Arrange
    getConfigurationMock.returns({
      get: (_s: string) => false,
    } as WorkspaceConfiguration);
    const fn = async () => {
      return;
    };
    const message = uuid.v4();

    withProgressMock.onCall(0).callsFake(async (_arg1: string, arg2: () => Promise<any>) => {
      return await arg2();
    });

    // Act
    await userInteraction.showIgnorableNotification(message, fn);

    // Assert
    assert.strictEqual(getConfigurationMock.calledOnce, true);
    assert.strictEqual(withProgressMock.called, true);
    assert.strictEqual(withProgressMock.callCount, 2);
  });

  it("showIgnorableNotification should not show notification", async () => {
    // Arrange
    getConfigurationMock.returns({
      get: (_s: string) => true,
    } as WorkspaceConfiguration);
    const fn = async () => {
      return;
    };
    const message = uuid.v4();

    withProgressMock.onCall(0).callsFake(async (_arg1: string, arg2: () => Promise<any>) => {
      return await arg2();
    });

    // Act
    await userInteraction.showIgnorableNotification(message, fn);

    // Assert
    assert.strictEqual(getConfigurationMock.calledOnce, true);
    assert.strictEqual(withProgressMock.called, true);
    assert.strictEqual(withProgressMock.callCount, 1);
  });
});
