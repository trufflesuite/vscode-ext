// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import assert from "assert";
import rewire from "rewire";
import sinon from "sinon";
import * as helpers from "../src/helpers";
import {OpenZeppelinService} from "../src/services";
import {IOZAsset, IOZContractCategory} from "../src/services/openZeppelin/models";
import {OpenZeppelinManifest} from "../src/services/openZeppelin/OpenZeppelinManifest";

describe("OpenZeppelinHelper", () => {
  afterEach(() => {
    sinon.restore();
  });

  it("createManifestAsync should create instance of OpenZeppelinManifest class", async () => {
    const testMetadata = {
      contentVersion: "contentVersion",

      baseUri: "baseUri",
      categories: [] as IOZContractCategory[],
      targetPoint: "targetPoint",
      assets: [] as IOZAsset[],
      apiDocumentationBaseUri: "apiDocumentationBaseUri",
      openZeppelinVersion: "openZeppelinVersion",
    };
    const openZeppelinHelperRewire = rewire("../src/helpers/openZeppelinHelper");
    openZeppelinHelperRewire.__set__("getManifestMetadata", sinon.stub().resolves(testMetadata));

    // Act
    const manifest = (await openZeppelinHelperRewire.createManifestAsync()) as OpenZeppelinManifest;
    assert.strictEqual(
      manifest.getCategories(),
      testMetadata.categories,
      "manifest.getCategories should be equal categories"
    );
    assert.strictEqual(
      manifest.getVersion(),
      testMetadata.openZeppelinVersion,
      "manifest.getVersion should be equal openZeppelinVersion"
    );
  });

  it("shouldUpgradeOpenZeppelinAsync should return true if current and latest versions differ and confirm dialog is true", async () => {
    sinon.stub(OpenZeppelinService, "getCurrentOpenZeppelinVersionAsync").resolves("current");
    sinon.stub(OpenZeppelinService, "getLatestOpenZeppelinVersionAsync").resolves("latest");
    sinon.stub(helpers, "showConfirmationDialog").resolves(true);

    const openZeppelinHelperRewire = rewire("../src/helpers/openZeppelinHelper");

    const result = await openZeppelinHelperRewire.shouldUpgradeOpenZeppelinAsync();
    assert.strictEqual(result, true, "shouldUpgradeOpenZeppelinAsync should return true");
  });
});
