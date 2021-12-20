import assert from "assert";
import fs from "fs-extra";
import path from "path";
import rewire from "rewire";
import sinon from "sinon";
import * as constants from "../../../src/Constants";
import * as helpers from "../../../src/helpers";
import {openZeppelinHelper} from "../../../src/helpers";
import {ContractService, OpenZeppelinService} from "../../../src/services";
import {IOZAsset, IOZContractCategory, IProjectMetadata} from "../../../src/services/openZeppelin/models";
import {OpenZeppelinManifest} from "../../../src/services/openZeppelin/OpenZeppelinManifest";
import {OpenZeppelinProjectJsonService} from "../../../src/services/openZeppelin/OpenZeppelinProjectJsonService";

describe("OpenZeppelinService", () => {
  let getWorkspaceRootMock: any;
  let getConfigurationAsyncStub: sinon.SinonStub<[string], Promise<{defaultValue: string; userValue: string}>>;

  beforeEach(() => {
    sinon.stub(helpers.openZeppelinHelper, "tryGetCurrentOpenZeppelinVersionAsync");
    getWorkspaceRootMock = sinon.stub(helpers, "getWorkspaceRoot");
    getConfigurationAsyncStub = sinon
      .stub(helpers.userSettings, "getConfigurationAsync")
      .resolves({defaultValue: "", userValue: ""});
  });

  afterEach(() => {
    sinon.restore();
  });

  it("getAllDownloadedAssetsAsync returns assets when project.json exist", async () => {
    // Arrange
    const expectedCountOfAssets = 2;
    getWorkspaceRootMock.returns(__dirname);

    // Act
    const assets = await OpenZeppelinService.getAllDownloadedAssetsAsync();

    // Assert
    assert.strictEqual(assets.length, expectedCountOfAssets, `Count of assets should be ${expectedCountOfAssets}`);
  });

  it("getAllDownloadedAssetsAsync returns empty array for assets when project.json doesn't exist", async () => {
    // Arrange
    const expectedCountOfAssets = 0;
    getWorkspaceRootMock.returns(path.resolve(__dirname, "../"));

    // Act
    const assets = await OpenZeppelinService.getAllDownloadedAssetsAsync();

    // Assert
    assert.strictEqual(assets.length, expectedCountOfAssets, `Count of assets should be ${expectedCountOfAssets}`);
  });

  it("downloadAssetsAsync should make file readonly", async () => {
    // Arrange
    sinon.stub(fs, "existsSync").returns(false);
    const fsChmodStub = sinon.stub(fs, "chmod").resolves();
    const openZeppelinServiceRewire = rewire("../../../src/services/openZeppelin/OpenZeppelinService");
    openZeppelinServiceRewire.__set__("download", sinon.stub().resolves());
    const testAssets = [{id: "1", name: "assetA"} as IOZAsset, {id: "2", name: "assetB"} as IOZAsset];

    // Act
    await openZeppelinServiceRewire.OpenZeppelinService.downloadAssetsAsync(
      "http://test.com",
      testAssets,
      true,
      "destFolder"
    );

    // Assert
    assert.strictEqual(
      fsChmodStub.callCount,
      testAssets.length,
      `fs.chmod should be called ${testAssets.length} times`
    );
  });

  it("updateOpenZeppelinContractsAsync should update contracts in user project", async () => {
    // Arrange
    const currentAssets = [{id: "1", name: "A"} as IOZAsset];
    const newAssets = [{id: "1", name: "A", dependencies: ["2"]} as IOZAsset, {id: "2", name: "B"} as IOZAsset];
    const currentProjectJson = {openZeppelin: {assets: currentAssets}} as IProjectMetadata;
    const mockOpenZeppelinManifest = {
      collectAssetsWithDependencies: (_assetIds: string[]) => newAssets,
      getAssets: () => [] as IOZAsset[],
      getBaseUrlToContractsSource: () => "http://test.com",
      getCategories: () => [] as IOZContractCategory[],
      getCategoryApiDocumentationUrl: (_category: IOZContractCategory) => "",
      getVersion: () => "1.0.0",
    } as OpenZeppelinManifest;
    sinon.stub(openZeppelinHelper, "createManifestAsync").resolves(mockOpenZeppelinManifest);
    sinon.stub(OpenZeppelinProjectJsonService, "getProjectJson").returns(currentProjectJson);
    sinon.stub(ContractService, "getSolidityContractsFolderPath").returns(Promise.resolve(""));
    getWorkspaceRootMock.returns(path.resolve(__dirname, "../"));
    sinon.stub(fs, "ensureDir").resolves();

    const fsRemoveSync = sinon.stub(fs, "removeSync").returns();
    const openZeppelinServiceRewire = rewire("../../../src/services/openZeppelin/OpenZeppelinService");

    openZeppelinServiceRewire.__set__("downloadNewVersionOfAssetsAsync", () => ({
      isDownloadSucceed: true,
      newAssets,
    }));
    openZeppelinServiceRewire.__set__("OpenZeppelinService.getOpenZeppelinFolderPath", () => Promise.resolve(""));
    openZeppelinServiceRewire.__set__("createNewProjectJsonAsync", sinon.stub().resolves());
    openZeppelinServiceRewire.__set__("moveFolderAsync", sinon.stub().resolves());
    openZeppelinServiceRewire.__set__("moveProjectJsonAsync", sinon.stub().resolves());

    const createNewProjectJsonAsyncStub = openZeppelinServiceRewire.__get__("createNewProjectJsonAsync");
    const moveFolderStub = openZeppelinServiceRewire.__get__("moveFolderAsync");
    const moveProjectJsonAsyncStub = openZeppelinServiceRewire.__get__("moveProjectJsonAsync");
    const manifest = await openZeppelinHelper.createManifestAsync("");

    // Act
    await openZeppelinServiceRewire.OpenZeppelinService.updateOpenZeppelinContractsAsync(manifest);

    // Assert
    assert.strictEqual(
      createNewProjectJsonAsyncStub.calledOnce,
      true,
      "createNewProjectJsonAsync should be called once"
    );
    assert.strictEqual(moveFolderStub.calledTwice, true, "moveFolder should be called twice");
    assert.strictEqual(moveProjectJsonAsyncStub.calledTwice, true, "moveProjectJsonAsync should be called twice");
    assert.strictEqual(fsRemoveSync.called, true, "fs.remove should be called");
  });

  describe("getCurrentOpenZeppelinVersionAsync", () => {
    const testProjectJsonVersion = "1.0.0";
    const testUserSettingsVersion = {defaultValue: "default", userValue: "value"};

    let openZeppelinServiceRewire: any;

    beforeEach(() => {
      openZeppelinServiceRewire = rewire("../../../src/services/openZeppelin/OpenZeppelinService");
      openZeppelinServiceRewire.__set__("OpenZeppelinService.projectJsonExists", () => false);
      getConfigurationAsyncStub.resolves(testUserSettingsVersion);
      sinon
        .stub(OpenZeppelinProjectJsonService, "getProjectJson")
        .resolves({openZeppelin: {version: testProjectJsonVersion}} as IProjectMetadata);

      constants.Constants.allOpenZeppelinVersions = [
        "1.0.0",
        testUserSettingsVersion.userValue,
        testUserSettingsVersion.defaultValue,
      ];
    });

    afterEach(() => {
      sinon.restore();
    });

    it("should return version from project.json when project.json exists", async () => {
      // Arrange
      openZeppelinServiceRewire.__set__("OpenZeppelinService.projectJsonExists", () => true);

      // Act
      const currentVersion = await openZeppelinServiceRewire.OpenZeppelinService.getCurrentOpenZeppelinVersionAsync();

      // Arrange
      assert.strictEqual(currentVersion, testProjectJsonVersion, `currentVersion should be ${testProjectJsonVersion}`);
    });

    it("should return user version from userSettings when project.json doesn't exist", async () => {
      // Act
      const currentVersion = await openZeppelinServiceRewire.OpenZeppelinService.getCurrentOpenZeppelinVersionAsync();

      // Arrange
      assert.strictEqual(
        currentVersion,
        testUserSettingsVersion.userValue,
        `currentVersion should be ${testUserSettingsVersion.userValue}`
      );
    });

    it("should return default version from userSettings when project.json doesn't exist and user version is not defined", async () => {
      // Arrange
      testUserSettingsVersion.userValue = "";
      getConfigurationAsyncStub.resolves(testUserSettingsVersion);

      // Act
      const currentVersion = await openZeppelinServiceRewire.OpenZeppelinService.getCurrentOpenZeppelinVersionAsync();

      // Assert
      assert.strictEqual(
        currentVersion,
        testUserSettingsVersion.defaultValue,
        `currentVersion should be ${testUserSettingsVersion.defaultValue}`
      );
    });
  });

  it("getLatestOpenZeppelinVersionAsync should return defaultValue from userSettings", async () => {
    // Arrange
    const testUserSettingsVersion = {defaultValue: "default", userValue: "value"};
    getConfigurationAsyncStub.resolves(testUserSettingsVersion);

    // Act
    const latestVersion = await OpenZeppelinService.getLatestOpenZeppelinVersionAsync();

    // Assert
    assert.strictEqual(
      latestVersion,
      testUserSettingsVersion.defaultValue,
      `currentVersion should be ${testUserSettingsVersion.defaultValue}`
    );
  });
});
