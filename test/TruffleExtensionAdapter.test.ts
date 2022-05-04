// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import assert from "assert";
import sinon from "sinon";
import {TruffleCommands} from "../src/commands/TruffleCommands";
import {TruffleExtensionAdapter} from "../src/services/extensionAdapter";
import {Uri} from "vscode";

describe("TruffleExtensionAdapter", () => {
  let buildContractsMock: sinon.SinonStub<any>;
  let deployContractsMock: sinon.SinonStub<any>;
  let execScriptMock: sinon.SinonStub<any>;
  let truffleExtensionAdapter: TruffleExtensionAdapter;

  beforeEach(() => {
    buildContractsMock = sinon.stub(TruffleCommands, "buildContracts");
    deployContractsMock = sinon.stub(TruffleCommands, "deployContracts");
    execScriptMock = sinon.stub(TruffleCommands, "execScript");

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

  it("exec method should call truffleCommands.execScript", async () => {
    // Act
    await truffleExtensionAdapter.execScript(Uri.file("./test.js"));

    // Assert
    assert.strictEqual(execScriptMock.calledOnce, true, "TruffleCommands.execScript should be called once");
  });
});
