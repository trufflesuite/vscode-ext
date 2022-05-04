// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import assert from "assert";
import {SinonMock, SinonExpectation, SinonStub, mock, stub, restore} from "sinon";
import uuid from "uuid";
import {CancellationToken, Progress, ProgressOptions, window, Uri} from "vscode";
import {TruffleCommands} from "../../src/commands/TruffleCommands";
import * as helpers from "../../src/helpers";
import * as commands from "../../src/helpers/command";
import {TestConstants} from "../TestConstants";
import {join} from "path";

describe("ExecScript Command", () => {
  describe("Integration test", async () => {
    let requiredMock: SinonMock;
    let getWorkspaceRootMock: any;
    let checkAppsSilent: SinonExpectation;
    let installTruffle: SinonExpectation;
    let commandContextMock: SinonMock;
    let executeCommandMock: SinonExpectation;
    let withProgressStub: SinonStub<[ProgressOptions, (progress: Progress<any>, token: CancellationToken) => any], any>;

    beforeEach(() => {
      requiredMock = mock(helpers.required);

      getWorkspaceRootMock = stub(helpers, "getWorkspaceRoot");
      getWorkspaceRootMock.returns(uuid.v4());

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

    it("should not throw exception when script executes successfully", async () => {
      // Arrange
      checkAppsSilent.returns(true);
      executeCommandMock.returns(uuid.v4());

      // Act
      const scriptPath = join(
        __dirname,
        TestConstants.truffleCommandTestDataFolder,
        TestConstants.truffleExecScriptExample
      );
      await TruffleCommands.execScript(Uri.file(scriptPath));

      // Assert
      assert.strictEqual(checkAppsSilent.calledOnce, true, "checkAppsSilent should be called once");
      assert.strictEqual(getWorkspaceRootMock.calledOnce, true, "getWorkspaceRoot should be called once");
      assert.strictEqual(installTruffle.called, false, "installTruffle should not be called");
      assert.strictEqual(executeCommandMock.called, true, "executeCommand should be called");
    });
  });
});
