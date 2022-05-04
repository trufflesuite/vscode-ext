// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import assert from "assert";
import rewire from "rewire";
import sinon from "sinon";
import uuid from "uuid";
import {QuickPickOptions} from "vscode";
import {Constants} from "../../../src/Constants";
import * as userInteraction from "../../../src/helpers/userInteraction";
import {ItemType} from "../../../src/Models";
import {LocalProject, LocalService} from "../../../src/Models/TreeItems";
import {TreeManager} from "../../../src/services";

describe("Create Service", () => {
  afterEach(() => {
    sinon.restore();
  });

  it("showQuickPick should be executed with Constants.placeholders.selectDestination placeholder", async () => {
    // Arrange
    const serviceCommandsRewire = rewire("../../../src/commands/ServiceCommands");
    const showQuickPickStub = sinon.stub();
    showQuickPickStub.returns({
      cmd: sinon.mock().returns(new LocalProject(uuid.v4(), 1234)),
      itemType: ItemType.LOCAL_PROJECT,
      label: Constants.treeItemData.service.local.label,
    });

    sinon.stub(TreeManager, "getItem").returns(new LocalService());
    sinon.replace(userInteraction, "showQuickPick", showQuickPickStub);

    // Act
    await serviceCommandsRewire.ServiceCommands.createProject();

    // Assert
    assert.strictEqual(
      (showQuickPickStub.getCall(0).args[1] as QuickPickOptions).placeHolder,
      `${Constants.placeholders.selectDestination}.`,
      "showQuickPick should be called with given arguments"
    );
  });
});
