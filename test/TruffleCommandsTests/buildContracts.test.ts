// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import assert from "assert";
import {SinonMock, SinonExpectation, SinonStub, mock, stub, restore} from "sinon";
import uuid from "uuid";
import {CancellationToken, Progress, ProgressOptions, Uri, window} from "vscode";
import {TruffleCommands} from "../../src/commands/TruffleCommands";
import * as helpers from "../../src/helpers";
import * as commands from "../../src/helpers/command";
import {TestConstants} from "../TestConstants";
import {TruffleWorkspace} from "../../src/helpers/workspace";

describe("BuildContracts Command", () => {
  describe("Integration test", async () => {
    let requiredMock: SinonMock;
    let getWorkspacesMock: any;
    let checkAppsSilent: SinonExpectation;
    let installTruffle: SinonExpectation;
    let commandContextMock: SinonMock;
    let executeCommandMock: SinonExpectation;
    let withProgressStub: SinonStub<[ProgressOptions, (progress: Progress<any>, token: CancellationToken) => any], any>;

    const root: Uri = Uri.parse(__dirname);
    const truffleWorkspace: TruffleWorkspace[] = [
      {
        dirName: "xpto",
        workspace: root,
        truffleConfig: Uri.parse(`${root.fsPath}/truffle-config.js`),
      },
    ];

    beforeEach(() => {
      requiredMock = mock(helpers.required);

      getWorkspacesMock = stub(helpers, "getWorkspaces");
      getWorkspacesMock.returns(truffleWorkspace);

      checkAppsSilent = requiredMock.expects("checkAppsSilent");
      installTruffle = requiredMock.expects("installTruffle");

      commandContextMock = mock(commands);
      executeCommandMock = commandContextMock.expects("executeCommand");

      withProgressStub = stub(window, "withProgress");
      withProgressStub.callsFake(async (...args: any[]) => {
        return args[1]();
      });
    });

    afterEach(() => {
      restore();
    });

    it("should not throw exception when truffle already installed", async () => {
      // Arrange
      checkAppsSilent.returns(true);
      executeCommandMock.returns(uuid.v4());

      // Act
      await TruffleCommands.buildContracts();

      // Assert
      assert.strictEqual(checkAppsSilent.calledOnce, true, "checkAppsSilent should be called once");
      assert.strictEqual(getWorkspacesMock.calledOnce, true, "getWorkspacesMock should be called once");
      assert.strictEqual(installTruffle.called, false, "installTruffle should not be called");
      assert.strictEqual(executeCommandMock.called, true, "executeCommand should be called");
    });

    it("should not throw exception when truffle not installed", async () => {
      // Arrange
      checkAppsSilent.returns(false);
      executeCommandMock.returns(uuid.v4());

      // Act
      await TruffleCommands.buildContracts();

      // Assert
      assert.strictEqual(checkAppsSilent.calledOnce, true, "checkAppsSilent should be called once");
      assert.strictEqual(getWorkspacesMock.calledOnce, false, "getWorkspacesMock be should called once");
      assert.strictEqual(installTruffle.calledOnce, true, "installTruffle should be called once");
      assert.strictEqual(executeCommandMock.called, false, "executeCommand should be called");
    });

    it("should throw exception when truffle build failed", async () => {
      // Arrange
      checkAppsSilent.returns(true);
      executeCommandMock.throws(TestConstants.testError);

      // Act and assert
      await assert.rejects(TruffleCommands.buildContracts(), Error, TestConstants.testError);
      assert.strictEqual(checkAppsSilent.calledOnce, true, "checkAppsSilent should be called once");
      assert.strictEqual(getWorkspacesMock.calledOnce, true, "getWorkspacesMock should be called once");
      assert.strictEqual(installTruffle.called, false, "installTruffle should not be called");
      assert.strictEqual(executeCommandMock.called, true, "executeCommand should be called");
    });

    it("should throw exception when truffle install failed", async () => {
      // Arrange
      checkAppsSilent.returns(false);
      executeCommandMock.returns(uuid.v4());
      installTruffle.throws(TestConstants.testError);

      // Act and assert
      await assert.rejects(TruffleCommands.buildContracts(), Error, TestConstants.testError);
      assert.strictEqual(checkAppsSilent.calledOnce, true, "checkAppsSilent should be called once");
      assert.strictEqual(getWorkspacesMock.called, false, "getWorkspacesMock should not be called");
      assert.strictEqual(installTruffle.called, true, "installTruffle should be called");
      assert.strictEqual(executeCommandMock.called, false, "executeCommand should not be called");
    });
  });
});
