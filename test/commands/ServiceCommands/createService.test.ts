// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import * as assert from "assert";
import rewire = require("rewire");
import * as sinon from "sinon";
import uuid = require("uuid");
import { QuickPickOptions } from "vscode";
import { Constants } from "../../../src/Constants";
import * as helpers from "../../../src/helpers";
import { ItemType } from "../../../src/Models";
import {
  AzureBlockchainProject,
  AzureBlockchainService,
  BlockchainDataManagerProject,
  BlockchainDataManagerService,
} from "../../../src/Models/TreeItems";
import { TreeManager } from "../../../src/services";

describe("Create Service", () => {
  afterEach(() => {
    sinon.restore();
  });

  it("showQuickPick should be executed with Constants.placeholders.selectDestination placeholder", async () => {
    // Arrange
    const serviceCommandsRewire = rewire("../../../src/commands/ServiceCommands");
    const showQuickPickStub = sinon.stub();
    showQuickPickStub.returns({
      cmd: sinon.mock().returns(new AzureBlockchainProject(uuid.v4(), uuid.v4(), uuid.v4(), [uuid.v4()])),
      itemType: ItemType.AZURE_BLOCKCHAIN_SERVICE,
      label: Constants.treeItemData.service.azure.label,
    });

    sinon.stub(TreeManager, "getItem").returns(new AzureBlockchainService());
    sinon.replace(helpers, "showQuickPick", showQuickPickStub);

    // Act
    await serviceCommandsRewire.ServiceCommands.createProject();

    // Assert
    assert.strictEqual(
      (showQuickPickStub.getCall(0).args[1] as QuickPickOptions).placeHolder,
      `${Constants.placeholders.selectDestination}.`,
      "showQuickPick should be called with given arguments"
    );
  });

  it(
    "showQuickPick should be executed with Constants.placeholders.selectDestination " +
      "placeholder and select Blockchain Data Manager",
    async () => {
      // Arrange
      const serviceCommandsRewire = rewire("../../../src/commands/ServiceCommands");
      const showQuickPickStub = sinon.stub();
      showQuickPickStub.returns({
        cmd: sinon.mock().returns(new BlockchainDataManagerProject(uuid.v4(), uuid.v4(), uuid.v4())),
        itemType: ItemType.BLOCKCHAIN_DATA_MANAGER_SERVICE,
        label: Constants.treeItemData.service.bdm.label,
      });

      sinon.stub(TreeManager, "getItem").returns(new BlockchainDataManagerService());
      sinon.replace(helpers, "showQuickPick", showQuickPickStub);

      // Act
      await serviceCommandsRewire.ServiceCommands.createProject();

      // Assert
      assert.strictEqual(
        (showQuickPickStub.args[0][1] as QuickPickOptions).placeHolder,
        `${Constants.placeholders.selectDestination}.`,
        "showQuickPick should be called with given arguments"
      );
    }
  );
});
