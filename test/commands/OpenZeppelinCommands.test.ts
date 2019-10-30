// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as assert from 'assert';
import * as path from 'path';
import rewire = require('rewire');
import * as sinon from 'sinon';
import uuid = require('uuid');
import { window } from 'vscode';
import { Constants } from '../../src/Constants';
import { TruffleConfiguration } from '../../src/helpers/truffleConfig';
import * as workspace from '../../src/helpers/workspace';
import { CancellationEvent } from '../../src/Models';
import {
  IDownloadingResult,
  IOZAsset,
  IOZContractCategory,
  OpenZeppelinMigrationsService,
  OpenZeppelinService,
  OZAssetType,
  PromiseState,
} from '../../src/services';

describe('OpenZeppelinCommands tests', () => {
  let testCategories: IOZContractCategory[];
  let getCategoriesStub: sinon.SinonStub<any[], any> | sinon.SinonStub<unknown[], unknown>;
  let collectAssetsWithDependenciesStub: sinon.SinonStub<any[], any> | sinon.SinonStub<unknown[], unknown>;
  let downloadFilesStub: sinon.SinonStub<any[], any> | sinon.SinonStub<unknown[], unknown>;
  let addAssetsToProjectJsonStub: sinon.SinonStub<[IOZAsset[]], Promise<void>>;
  let getAssetsStatusStub: sinon.SinonStub<any>;
  let generateMigrationsStub: sinon.SinonStub<[IOZAsset[]], Promise<void>>;
  let getCategoryApiDocumentationUrlStub: sinon.SinonStub<any>;

  let withProgressStub: sinon.SinonStub<any[], any>;
  let showQuickPickStub: sinon.SinonStub<any[], any>;
  let showInformationMessageStub: sinon.SinonStub<any[], any>;
  let showErrorMessageStub: sinon.SinonStub<any[], any>;

  let selectedCategory: IOZContractCategory;
  let testAssets: IOZAsset[];

  let openZeppelinCommands: { addCategory: () => Promise<void> };

  let openStub: sinon.SinonStub<any[], any>;

  beforeEach(() => {
    const numberOfCategory = 2;
    testCategories = getTestCategories();
    selectedCategory = testCategories[numberOfCategory];
    testAssets = getTestAssetsWithDependencies(selectedCategory.assets);

    const getWorkspaceRootMock = sinon.stub(workspace, 'getWorkspaceRoot');
    getWorkspaceRootMock.returns(path.join(__filename, '../../TruffleCommandsTests/testData'));

    sinon.stub(TruffleConfiguration.TruffleConfig.prototype, 'getConfiguration')
      .returns({ contracts_directory: uuid.v4() } as TruffleConfiguration.IConfiguration);

    addAssetsToProjectJsonStub = sinon.stub(OpenZeppelinService, 'addAssetsToProjectJson');
    getCategoriesStub = sinon.stub(OpenZeppelinService, 'getCategories')
      .returns(testCategories);
    collectAssetsWithDependenciesStub = sinon.stub(OpenZeppelinService, 'collectAssetsWithDependencies')
      .returns(testAssets);
    getAssetsStatusStub = sinon.stub(OpenZeppelinService, 'getAssetsStatus');
    downloadFilesStub = sinon.stub(OpenZeppelinService, 'downloadFiles');
    generateMigrationsStub = sinon.stub(OpenZeppelinMigrationsService, 'generateMigrations');
    getCategoryApiDocumentationUrlStub = sinon.stub(OpenZeppelinService, 'getCategoryApiDocumentationUrl');

    getAssetsStatusStub.returns({ existing: [], missing: testAssets });

    showQuickPickStub = sinon.stub(window, 'showQuickPick');
    showInformationMessageStub = sinon.stub(window, 'showInformationMessage');
    showErrorMessageStub = sinon.stub(window, 'showErrorMessage');
    withProgressStub = sinon.stub(window, 'withProgress');
    withProgressStub.callsFake(async (...args: any[]) => {
      return args[1]();
    });

    showQuickPickStub.callsFake(async (...args: any[]) => {
      return args[0].find((arg: any) => arg.label === selectedCategory.name);
    });

    const testDownloadingResult: IDownloadingResult[] = [];
    testAssets.forEach((asset) => {
      testDownloadingResult.push({
        asset,
        state: PromiseState.fulfilled,
      });
    });
    downloadFilesStub.returns(testDownloadingResult);

    openStub = sinon.stub().resolves();
    const openZeppelinCommandsRewire = rewire('../../src/commands/OpenZeppelinCommands');
    openZeppelinCommandsRewire.__set__('open', openStub);
    openZeppelinCommands = openZeppelinCommandsRewire.__get__('OpenZeppelinCommands');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should complete basic pipeline', async () => {
    // Arrange
    const wereDownloadedMessage = Constants.openZeppelin.wereDownloaded(selectedCategory.assets.length);
    showInformationMessageStub.onCall(1).returns(Constants.openZeppelin.moreDetailsButtonTitle);

    // Act
    await openZeppelinCommands.addCategory();

    // Assert
    assert.strictEqual(getCategoriesStub.called, true, 'getCategories should be called.');
    assert.strictEqual(showQuickPickStub.calledOnce, true, 'showQuickPick should called once.');
    assert.deepStrictEqual(
      showQuickPickStub.args[0][1],
      {
        ignoreFocusOut: true,
        placeHolder: Constants.openZeppelin.selectCategoryForDownloading,
      },
      'selectCategory should ask for category.',
    );
    assert.strictEqual(collectAssetsWithDependenciesStub.calledOnce, true, 'collectAssetsWithDependencies should called once.');
    assert.deepStrictEqual(
      collectAssetsWithDependenciesStub.args[0][0],
      selectedCategory.assets,
      'collectAssetsWithDependencies should called once with asserts from selected category.',
    );
    assert.strictEqual(downloadFilesStub.calledOnce, true, 'downloadFiles should be called');
    assert.strictEqual(addAssetsToProjectJsonStub.called, true, 'addAssetsToProjectJson should be called');
    assert.strictEqual(showInformationMessageStub.calledTwice, true, 'showInformationMessage should be called twice');
    assert.strictEqual(
      showInformationMessageStub.args[0][0],
      wereDownloadedMessage,
      'should be displayed message with number of downloaded items',
    );
    assert.strictEqual(
      showInformationMessageStub.args[1][0],
      Constants.openZeppelin.exploreDownloadedContractsInfo,
      'should be displayed message with information about downloaded category',
    );
    assert.strictEqual(
      getCategoryApiDocumentationUrlStub.calledOnce,
      true,
      'getCategoryApiDocumentationUrl should be called',
    );
    assert.strictEqual(generateMigrationsStub.called, true, 'generateMigrations should be called');
  });

  it('should downloads selected category', async () => {
    // Act
    await openZeppelinCommands.addCategory();

    // Assert
    assert.strictEqual(downloadFilesStub.args[0][0], testAssets, 'downloadFiles should called for selected asset');
  });

  it('throws cancellation event when user don`t select category', async () => {
    // Arrange
    const notExistingCategoryName = 'notExistingCategoryName';

    showQuickPickStub.callsFake(async (...args: any[]) => {
      return args[0].find((arg: any) => arg.label === notExistingCategoryName);
    });

    // Act and Assert
    await assert.rejects(
      async () => await openZeppelinCommands.addCategory(),
      CancellationEvent,
      'addCategory should throw cancellation event.');
    assert.strictEqual(getCategoriesStub.calledOnce, true, 'getCategories should called once.');
    assert.strictEqual(showQuickPickStub.calledOnce, true, 'showQuickPick should called once.');
    assert.strictEqual(
      collectAssetsWithDependenciesStub.notCalled,
      true,
      'collectAssetsWithDependencies should not called.');
    assert.strictEqual(withProgressStub.notCalled, true, 'withProgress should not called.');
  });

  it('should ask for overwrite existing files and overwrite on positive answer', async () => {
    // Arrange
    const existingAsset = testAssets.slice(3, 4);
    const missingAsset = testAssets.slice(0, 3);
    getAssetsStatusStub
      .returns({
        existing: existingAsset,
        missing: missingAsset,
      });
    showInformationMessageStub.onCall(0).returns(Constants.openZeppelin.replaceButtonTitle);

    // Act
    await openZeppelinCommands.addCategory();

    // Assert
    assert.strictEqual(showInformationMessageStub.calledThrice, true, 'showQuickPick should called three times');
    assert.strictEqual(
      showInformationMessageStub.args[0][0],
      Constants.openZeppelin.alreadyExisted(existingAsset),
      'alreadyExisted message should displayed once.',
    );
    assert.strictEqual(downloadFilesStub.args[0][1], true, 'downloading should be called with overwrite flag');
    assert.strictEqual(downloadFilesStub.args[0][0].length, testAssets.length, 'downloading full asset of items');
  });

  it('should ask for overwrite existed files and skip files on negative answer', async () => {
    // Arrange
    const existingAsset = testAssets.slice(3, 4);
    const missingAsset = testAssets.slice(0, 3);
    getAssetsStatusStub
      .returns({
        existing: existingAsset,
        missing: missingAsset,
      });
    showInformationMessageStub.onCall(0).returns(Constants.openZeppelin.skipButtonTitle);

    // Act
    await openZeppelinCommands.addCategory();

    // Assert
    assert.strictEqual(showInformationMessageStub.calledThrice, true, 'showQuickPick should called three times.');
    assert.strictEqual(
      showInformationMessageStub.args[0][0],
      Constants.openZeppelin.alreadyExisted(existingAsset),
      'showQuickPick should called once.',
    );
    assert.strictEqual(downloadFilesStub.args[0][1], false, 'downloading should be called without overwrite flag');
    assert.strictEqual(downloadFilesStub.args[0][0].length, missingAsset.length, 'downloading only missing assets');
  });

  it('should show error message if some files failed on downloading and allow to retry', async () => {
    // Arrange
    const rejectedAssets = [
      { asset: {}, state: PromiseState.rejected },
      { asset: {}, state: PromiseState.rejected },
    ];
    downloadFilesStub.returns([
      { asset: {}, state: PromiseState.fulfilled },
      ...rejectedAssets,
    ]);
    showErrorMessageStub
      .onCall(0).returns(Constants.openZeppelin.retryButtonTitle)
      .onCall(1).returns(Constants.openZeppelin.cancelButtonTitle);

    // Act
    await openZeppelinCommands.addCategory();

    // Assert
    assert.strictEqual(
      showErrorMessageStub.args[0][0],
      Constants.openZeppelin.wereNotDownloaded(rejectedAssets.length),
      'showErrorMessageStub should called with exact message',
    );
    assert.strictEqual(downloadFilesStub.calledTwice, true, 'downloadFiles should be retried');
  });

  it('should open documentation for chosen category after downloading', async () => {
    // Arrange
    const testDocumentationUrl = 'testUrl';
    getCategoryApiDocumentationUrlStub.returns(testDocumentationUrl);
    generateMigrationsStub.resolves();
    showInformationMessageStub.onCall(1).returns(Constants.openZeppelin.moreDetailsButtonTitle);

    // Act
    await openZeppelinCommands.addCategory();

    // Assert
    assert.strictEqual(getCategoryApiDocumentationUrlStub.calledWithMatch(selectedCategory), true,
      'getCategoryApiDocumentationUrl should be called with chosen category');
    assert.strictEqual(openStub.calledWith(testDocumentationUrl), true,
      `open should be called with ${testDocumentationUrl}`);
    assert.strictEqual(openStub.calledAfter(downloadFilesStub), true, 'open should be called after downloadFiles');
  });
});

function getTestCategories(): IOZContractCategory[] {
  const testCategories: IOZContractCategory[] = [{
    assets: [uuid.v4()],
    id: uuid.v4(),
    name: uuid.v4(),
  },
  {
    assets: [uuid.v4(), uuid.v4()],
    id: uuid.v4(),
    name: uuid.v4(),
  },
  {
    assets: [uuid.v4(), uuid.v4(), uuid.v4(), uuid.v4()],
    id: uuid.v4(),
    name: uuid.v4(),
  }];

  return testCategories;
}

function getTestAssetsWithDependencies(assets: string[]): IOZAsset[] {
  const assetsWithDependencies: IOZAsset[] = [];

  assets.forEach((asset) => {
    assetsWithDependencies.push({
      dependencies: [uuid.v4()],
      hash: uuid.v4(),
      id: asset,
      name: uuid.v4(),
      type: OZAssetType.contract,
    });
  });

  return assetsWithDependencies;
}
