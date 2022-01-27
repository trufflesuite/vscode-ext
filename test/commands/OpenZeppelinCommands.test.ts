// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import assert from "assert";
import path from "path";
import rewire from "rewire";
import sinon from "sinon";
import uuid = require("uuid");
import {
  CancellationToken,
  MessageItem,
  MessageOptions,
  Progress,
  ProgressOptions,
  QuickPickItem,
  QuickPickOptions,
  window,
} from "vscode";
import {Constants} from "../../src/Constants";
import * as helpers from "../../src/helpers";
import {openZeppelinHelper} from "../../src/helpers";
import {TruffleConfiguration} from "../../src/helpers/truffleConfig";
import {CancellationEvent} from "../../src/Models";
import {OpenZeppelinMigrationsService, OpenZeppelinService} from "../../src/services";
import {
  IDownloadingResult,
  IOZAsset,
  IOZContractCategory,
  OZAssetType,
  PromiseState,
} from "../../src/services/openZeppelin/models";
import {OpenZeppelinManifest} from "../../src/services/openZeppelin/OpenZeppelinManifest";

describe("OpenZeppelinCommands tests", () => {
  let testCategories: IOZContractCategory[];
  let getCategoriesStub: sinon.SinonSpy<[], IOZContractCategory[]>;
  let collectAssetsWithDependenciesStub: sinon.SinonSpy<[(string[] | undefined)?], IOZAsset[]>;
  let downloadAssetsAsyncStub: sinon.SinonStub<
    [string, IOZAsset[], (boolean | undefined)?, (string | undefined)?],
    Promise<IDownloadingResult[]>
  >;
  let getAssetsStatusStub: sinon.SinonStub<any>;
  let generateMigrationsStub: sinon.SinonStub<[IOZAsset[]], Promise<void>>;
  let getCategoryApiDocumentationUrlStub: sinon.SinonStub<any>;
  let updateProjectJsonAsyncStub: sinon.SinonStub<[string, IOZContractCategory, IOZAsset[]], Promise<void>>;

  let withProgressStub: sinon.SinonStub<
    [ProgressOptions, (progress: Progress<any>, token: CancellationToken) => any],
    any
  >;
  let showQuickPickStub: sinon.SinonStub<
    [QuickPickItem[] | Thenable<QuickPickItem[]>, (QuickPickOptions | undefined)?, (CancellationToken | undefined)?],
    any
  >;
  let showInformationMessageStub: sinon.SinonStub<[string, MessageOptions, ...MessageItem[]], any>;
  let showErrorMessageStub: sinon.SinonStub<[string, MessageOptions, ...MessageItem[]], any>;

  let selectedCategory: IOZContractCategory;
  let testAssets: IOZAsset[];

  let openZeppelinCommandsRewire: any;

  let openStub: sinon.SinonStub<any[], any>;

  beforeEach(() => {
    const numberOfCategory = 2;
    testCategories = getTestCategories();
    selectedCategory = testCategories[numberOfCategory];
    testAssets = getTestAssetsWithDependencies(selectedCategory.assets);
    const mockOpenZeppelinManifest = {
      collectAssetsWithDependencies: (_assetIds: string[]) => testAssets,
      getAssets: () => [] as IOZAsset[],
      getBaseUrlToContractsSource: () => "http://test.com",
      getCategories: () => testCategories,
      getCategoryApiDocumentationUrl: (_category: IOZContractCategory) => "",
      getVersion: () => "1.0.0",
    } as OpenZeppelinManifest;

    const getWorkspaceRootMock = sinon.stub(helpers, "getWorkspaceRoot");
    getWorkspaceRootMock.returns(path.join(__filename, "../../TruffleCommandsTests/testData"));

    sinon
      .stub(TruffleConfiguration.TruffleConfig.prototype, "getConfiguration")
      .returns(Promise.resolve({contracts_directory: uuid.v4()} as TruffleConfiguration.IConfiguration));

    getAssetsStatusStub = sinon.stub(OpenZeppelinService, "getAssetsStatus");
    downloadAssetsAsyncStub = sinon.stub(OpenZeppelinService, "downloadAssetsAsync");
    updateProjectJsonAsyncStub = sinon.stub(OpenZeppelinService, "updateProjectJsonAsync").resolves();
    generateMigrationsStub = sinon.stub(OpenZeppelinMigrationsService, "generateMigrations").resolves();
    getCategoriesStub = sinon.spy(mockOpenZeppelinManifest, "getCategories");
    collectAssetsWithDependenciesStub = sinon.spy(mockOpenZeppelinManifest, "collectAssetsWithDependencies");
    getCategoryApiDocumentationUrlStub = sinon.stub(mockOpenZeppelinManifest, "getCategoryApiDocumentationUrl");

    sinon.stub(openZeppelinHelper, "tryGetCurrentOpenZeppelinVersionAsync").resolves("version");
    sinon.stub(openZeppelinHelper, "createManifestAsync").resolves(mockOpenZeppelinManifest);

    getAssetsStatusStub.returns({existing: [], missing: testAssets});

    showQuickPickStub = sinon.stub(window, "showQuickPick");
    showInformationMessageStub = sinon.stub(window, "showInformationMessage");
    showErrorMessageStub = sinon.stub(window, "showErrorMessage");
    withProgressStub = sinon.stub(window, "withProgress");
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
    downloadAssetsAsyncStub.resolves(testDownloadingResult);

    openStub = sinon.stub().resolves();
    openZeppelinCommandsRewire = rewire("../../src/commands/OpenZeppelinCommands");
    openZeppelinCommandsRewire.__set__("open", openStub);
  });

  afterEach(() => {
    sinon.restore();
  });

  it("addCategory should complete basic pipeline", async () => {
    // Arrange
    getCategoryApiDocumentationUrlStub.returns("testUrl");
    const wereDownloadedMessage = Constants.openZeppelin.wereDownloaded(selectedCategory.assets.length);
    showInformationMessageStub.onCall(0).returns(Constants.openZeppelin.moreDetailsButtonTitle);

    // Act
    await openZeppelinCommandsRewire.OpenZeppelinCommands.addCategory();

    // Assert
    assert.strictEqual(getCategoriesStub.called, true, "getCategories should be called.");
    assert.strictEqual(showQuickPickStub.calledOnce, true, "showQuickPick should called once.");
    assert.deepStrictEqual(
      showQuickPickStub.args[0][1],
      {
        ignoreFocusOut: true,
        placeHolder: Constants.openZeppelin.selectCategoryForDownloading,
      },
      "selectCategory should ask for category."
    );
    assert.strictEqual(
      collectAssetsWithDependenciesStub.calledOnce,
      true,
      "collectAssetsWithDependencies should called once."
    );
    assert.deepStrictEqual(
      collectAssetsWithDependenciesStub.args[0][0],
      selectedCategory.assets,
      "collectAssetsWithDependencies should called once with asserts from selected category."
    );
    assert.strictEqual(downloadAssetsAsyncStub.calledOnce, true, "downloadAssetsAsync should be called");
    assert.strictEqual(showInformationMessageStub.calledTwice, true, "showInformationMessage should be called twice");
    assert.strictEqual(
      showInformationMessageStub.args[0][0],
      wereDownloadedMessage,
      "should be displayed message with number of downloaded items"
    );
    assert.strictEqual(
      showInformationMessageStub.args[1][0],
      Constants.openZeppelin.exploreDownloadedContractsInfo,
      "should be displayed message with information about downloaded category"
    );
    assert.strictEqual(updateProjectJsonAsyncStub.calledOnce, true, "updateProjectJsonAsync should be called once");
    assert.strictEqual(
      getCategoryApiDocumentationUrlStub.calledOnce,
      true,
      "getCategoryApiDocumentationUrl should be called"
    );
    assert.strictEqual(generateMigrationsStub.called, true, "generateMigrations should be called");
  });

  it("addCategory should downloads selected category", async () => {
    // Arrange
    const showQuickPick = sinon.stub(helpers, "showQuickPick");
    showQuickPick.callsFake(async (...args: any[]) => {
      return args[0].find((arg: any) => arg.label === selectedCategory.name);
    });

    // Act
    await openZeppelinCommandsRewire.OpenZeppelinCommands.addCategory();

    // Assert
    assert.strictEqual(
      downloadAssetsAsyncStub.args[0][1],
      testAssets,
      "downloadAssetsAsync should called for selected asset"
    );
  });

  it("addCategory throws cancellation event when user don`t select category", async () => {
    // Arrange
    const notExistingCategoryName = "notExistingCategoryName";

    showQuickPickStub.callsFake(async (...args: any[]) => {
      return args[0].find((arg: any) => arg.label === notExistingCategoryName);
    });

    // Act and Assert
    await assert.rejects(
      async () => await openZeppelinCommandsRewire.OpenZeppelinCommands.addCategory(),
      CancellationEvent,
      "addCategory should throw cancellation event."
    );
    assert.strictEqual(getCategoriesStub.calledOnce, true, "getCategories should called once.");
    assert.strictEqual(showQuickPickStub.calledOnce, true, "showQuickPick should called once.");
    assert.strictEqual(
      collectAssetsWithDependenciesStub.notCalled,
      true,
      "collectAssetsWithDependencies should not called."
    );
    assert.strictEqual(withProgressStub.notCalled, true, "withProgress should not called.");
  });

  it("addCategory should ask for overwrite existing files and overwrite on positive answer", async () => {
    // Arrange
    const existingAsset = testAssets.slice(3, 4);
    const missingAsset = testAssets.slice(0, 3);
    getAssetsStatusStub.returns({
      existing: existingAsset,
      missing: missingAsset,
    });
    showInformationMessageStub.onCall(0).returns(Constants.openZeppelin.replaceButtonTitle);

    // Act
    await openZeppelinCommandsRewire.OpenZeppelinCommands.addCategory();

    // Assert
    assert.strictEqual(showInformationMessageStub.calledTwice, true, "showInformationMessage should called twice");
    assert.strictEqual(
      showInformationMessageStub.args[0][0],
      Constants.openZeppelin.alreadyExisted(existingAsset),
      "alreadyExisted message should displayed once."
    );
    assert.strictEqual(downloadAssetsAsyncStub.args[0][2], true, "downloading should be called with overwrite flag");
    assert.strictEqual(downloadAssetsAsyncStub.args[0][1].length, testAssets.length, "downloading full asset of items");
  });

  it("addCategory should ask for overwrite existed files and skip files on negative answer", async () => {
    // Arrange
    const existingAsset = testAssets.slice(3, 4);
    const missingAsset = testAssets.slice(0, 3);
    getAssetsStatusStub.returns({
      existing: existingAsset,
      missing: missingAsset,
    });
    showInformationMessageStub.onCall(0).returns(Constants.openZeppelin.skipButtonTitle);

    // Act
    await openZeppelinCommandsRewire.OpenZeppelinCommands.addCategory();

    // Assert
    assert.strictEqual(showInformationMessageStub.calledTwice, true, "showInformationMessage should called twice");
    assert.strictEqual(
      showInformationMessageStub.args[0][0],
      Constants.openZeppelin.alreadyExisted(existingAsset),
      "showQuickPick should called once."
    );
    assert.strictEqual(
      downloadAssetsAsyncStub.args[0][2],
      false,
      "downloading should be called without overwrite flag"
    );
    assert.strictEqual(
      downloadAssetsAsyncStub.args[0][1].length,
      missingAsset.length,
      "downloading only missing assets"
    );
  });

  it("addCategory should show error message if some files failed on downloading and allow to retry", async () => {
    // Arrange
    const rejectedAssets = [
      {asset: {} as IOZAsset, state: PromiseState.rejected},
      {asset: {} as IOZAsset, state: PromiseState.rejected},
    ];
    downloadAssetsAsyncStub.resolves([{asset: {} as IOZAsset, state: PromiseState.fulfilled}, ...rejectedAssets]);
    showErrorMessageStub
      .onCall(0)
      .returns(Constants.openZeppelin.retryButtonTitle)
      .onCall(1)
      .returns(Constants.openZeppelin.cancelButtonTitle);

    // Act
    await openZeppelinCommandsRewire.OpenZeppelinCommands.addCategory();

    // Assert
    assert.strictEqual(
      showErrorMessageStub.args[0][0],
      Constants.openZeppelin.wereNotDownloaded(rejectedAssets.length),
      "showErrorMessageStub should called with exact message"
    );
    assert.strictEqual(downloadAssetsAsyncStub.calledTwice, true, "downloadFiles should be retried");
  });

  it("addCategory should open documentation for chosen category after downloading", async () => {
    // Arrange
    const testDocumentationUrl = "testUrl";
    getCategoryApiDocumentationUrlStub.returns(testDocumentationUrl);
    generateMigrationsStub.resolves();
    showInformationMessageStub.onCall(1).returns(Constants.openZeppelin.moreDetailsButtonTitle);

    // Act
    await openZeppelinCommandsRewire.OpenZeppelinCommands.addCategory();

    // Assert
    assert.strictEqual(
      getCategoryApiDocumentationUrlStub.calledWithMatch(selectedCategory),
      true,
      "getCategoryApiDocumentationUrl should be called with chosen category"
    );
    assert.strictEqual(
      openStub.calledWith(testDocumentationUrl),
      true,
      `open should be called with ${testDocumentationUrl}`
    );
    assert.strictEqual(
      openStub.calledAfter(downloadAssetsAsyncStub),
      true,
      "open should be called after downloadFiles"
    );
  });

  it("addCategory should not ask and open category documentation if it doesn't exist", async () => {
    // Arrange
    getCategoryApiDocumentationUrlStub.returns(undefined);
    generateMigrationsStub.resolves();

    // Act
    await openZeppelinCommandsRewire.OpenZeppelinCommands.addCategory();

    // Assert
    assert.strictEqual(
      showInformationMessageStub.calledWith(Constants.openZeppelin.exploreDownloadedContractsInfo),
      false,
      "showInformationMessageStub should not be called with explore contracts info message"
    );
    assert.strictEqual(openStub.called, false, "open should not be called");
  });
});

function getTestCategories(): IOZContractCategory[] {
  const testCategories: IOZContractCategory[] = [
    {
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
    },
  ];

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
