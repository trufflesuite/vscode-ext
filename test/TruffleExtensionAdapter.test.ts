// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import * as assert from "assert";
import * as sinon from "sinon";
import { TruffleCommands } from "../src/commands/TruffleCommands";
import { TruffleExtensionAdapter } from "../src/services/extensionAdapter";

describe("TruffleExtensionAdapter", () => {
  let buildContractsMock: sinon.SinonStub<any>;
  let deployContractsMock: sinon.SinonStub<any>;
  let truffleExtensionAdapter: TruffleExtensionAdapter;

  beforeEach(() => {
    buildContractsMock = sinon.stub(TruffleCommands, "buildContracts");
    deployContractsMock = sinon.stub(TruffleCommands, "deployContracts");

    truffleExtensionAdapter = new TruffleExtensionAdapter();
  });

  afterEach(() => {
    sinon.restore();
  });

  it("build method should call truffleCommands.buildContracts", async () => {
    // Act
    await truffleExtensionAdapter.build();

    // Assert
    assert.strictEqual(buildContractsMock.calledOnce, true, "TruffleCommands.buildContracts should be called once");
  });

  it("deploy method should call truffleCommands.buildContracts", async () => {
    // Act
    await truffleExtensionAdapter.deploy();

    // Assert
    assert.strictEqual(deployContractsMock.calledOnce, true, "TruffleCommands.deployContracts should be called once");
  });
});
