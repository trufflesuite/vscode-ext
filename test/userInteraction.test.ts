// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as assert from 'assert';
import * as fs from 'fs';
import * as sinon from 'sinon';
import { InputBoxOptions, QuickPickItem, QuickPickOptions, Uri, window, workspace } from 'vscode';
import { Constants } from '../src/Constants';
import * as userInteraction from '../src/helpers/userInteraction';
import { CancellationEvent } from '../src/Models';

interface ITestItems extends QuickPickItem {
  id: number;
  label: string;
  description: string;
  testProperty: string;
}

describe('User interaction test', () => {
  let windowMock: sinon.SinonMock;

  beforeEach(() => {
    windowMock = sinon.mock(window);
  });

  afterEach(() => {
    windowMock.restore();
    windowMock.verify();
  });

  it('showInputBox should return a value', async () => {
    const option: InputBoxOptions = {};

    windowMock.expects('showInputBox').withArgs(option).returns('test');
    const result = await userInteraction.showInputBox(option);

    assert.strictEqual(result, 'test');
  });

  it('showInputBox should throw cancellation event', async () => {
    const option: InputBoxOptions = {};

    windowMock.expects('showInputBox').withArgs(option).returns(undefined);

    try {
      await userInteraction.showInputBox(option);
      assert.fail();
    } catch (error) {
      assert.strictEqual(true, error instanceof CancellationEvent);
    }
  });

  it('showQuickPick should return a value', async () => {
    const option: QuickPickOptions = {};
    const items: QuickPickItem[] = [
      {
        description: 'test 1',
        label: 'test 1',
      },
      {
        description: 'test 2',
        label: 'test 2',
      },
    ];

    windowMock.expects('showQuickPick').withArgs(items, option).returns(items[1]);
    const result = await userInteraction.showQuickPick(items, option);

    assert.deepStrictEqual(result, items[1]);
  });

  it('showQuickPick with custom items should return a value', async () => {
    const option: QuickPickOptions = {};
    const items: ITestItems[] = [
      {
        description: 'test 1',
        id: 1,
        label: 'test 1',
        testProperty: 'test 1',
      },
      {
        description: 'test 2',
        id: 2,
        label: 'test 2',
        testProperty: 'test 2',
      },
    ];

    windowMock.expects('showQuickPick').withArgs(items, option).returns(items[1]);
    const result = await userInteraction.showQuickPick(items, option);

    assert.deepStrictEqual(result, items[1]);
  });

  it('showQuickPick should throw cancellation event', async () => {
    const option: QuickPickOptions = {};
    const items: QuickPickItem[] = [
      {
        description: 'test 1',
        label: 'test 1',
      },
      {
        description: 'test 2',
        label: 'test 2',
      },
    ];

    windowMock.expects('showQuickPick').withArgs(items, option).returns(undefined);

    try {
      await userInteraction.showQuickPick(items, option);
      assert.fail();
    } catch (error) {
      assert.strictEqual(true, error instanceof CancellationEvent);
    }
  });

  it('showConfirmPaidOperationDialog should throw cancellation event if answer not yes', async () => {
    const answer = 'test';

    windowMock.expects('showInputBox').returns(answer);

    try {
      await userInteraction.showConfirmPaidOperationDialog();
      assert.fail();
    } catch (error) {
      assert.strictEqual(true, error instanceof CancellationEvent);
    } finally {
      windowMock.restore();
      windowMock.verify();
    }
  });

  it('showConfirmPaidOperationDialog should throw cancellation event if answer undefined', async () => {
    windowMock.expects('showInputBox').returns(undefined);

    try {
      await userInteraction.showConfirmPaidOperationDialog();
      assert.fail();
    } catch (error) {
      assert.strictEqual(true, error instanceof CancellationEvent);
    }
  });

  it('showConfirmPaidOperationDialog should not throw cancellation event if answer yes', async () => {
    const answer = Constants.confirmationDialogResult.yes;

    windowMock.expects('showInputBox').returns(answer);

    try {
      await userInteraction.showConfirmPaidOperationDialog();
    } catch (error) {
      assert.fail();
    }
  });

  it('showOpenFolderDialog should return a folder path', async () => {
    const folderPath = 'test/test';
    const uris: Uri[] = [{ fsPath: folderPath} as Uri];

    windowMock.expects('showOpenDialog').returns(uris);
    const result = await userInteraction.showOpenFolderDialog();

    assert.deepStrictEqual(result, folderPath);
  });

  it('showOpenFolderDialog should return path of first folder', async () => {
    const folderPath1 = 'test/test';
    const folderPath2 = 'test2/test2';
    const uris: Uri[] = [{ fsPath: folderPath1}, { fsPath: folderPath2}] as Uri[];

    windowMock.expects('showOpenDialog').returns(uris);
    const result = await userInteraction.showOpenFolderDialog();

    assert.strictEqual(result, folderPath1);
  });

  it('showOpenFolderDialog should throw cancellation event if dialog canceled', async () => {
    windowMock.expects('showOpenDialog').returns(undefined);

    try {
      await userInteraction.showOpenFolderDialog();
      assert.fail();
    } catch (error) {
      assert.strictEqual(true, error instanceof CancellationEvent);
    }
  });

  it('saveTextInFile should return file path', async () => {
    const fsMock = sinon.mock(fs);
    const workspaceMock = sinon.mock(workspace);
    const filePathe = 'filePath';
    const text = 'test text';

    workspaceMock.expects('openTextDocument');
    windowMock.expects('showTextDocument');
    windowMock.expects('showSaveDialog').returns({ fsPath: filePathe} as Uri);
    fsMock.expects('writeFileSync');

    const result = await userInteraction.saveTextInFile(text, filePathe);

    assert.strictEqual(result, filePathe);

    fsMock.restore();
    fsMock.verify();
    workspaceMock.restore();
    workspaceMock.verify();
  });

  it('saveTextInFile should throw cancellation event if dialog canceled', async () => {
    const workspaceMock = sinon.mock(workspace);
    const filePathe = 'filePath';
    const text = 'test text';

    workspaceMock.expects('openTextDocument');
    windowMock.expects('showTextDocument');
    windowMock.expects('showSaveDialog').returns(undefined);

    try {
      await userInteraction.saveTextInFile(text, filePathe);
      assert.fail();
    } catch (error) {
      assert.strictEqual(true, error instanceof CancellationEvent);
    } finally {
      workspaceMock.restore();
      workspaceMock.verify();
    }
  });
});
