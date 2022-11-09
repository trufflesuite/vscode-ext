// Copyright (c) 2022. Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import * as AW from '@/helpers/AbstractWorkspace';
import {expect} from 'chai';
import glob from 'glob';
import fs from 'fs';
import sinon from 'sinon';
import {sdkCoreCommands} from '@/commands/SdkCoreCommands';
import {Uri, workspace} from '../vscode';
import {TruffleCommands} from '@/commands/TruffleCommands';
import * as HardhatCommands from '@/commands/HardhatCommands';

describe('SDK Core Commands', () => {
  const sandbox = sinon.createSandbox();

  let globStub: any;
  let fsStub: any;
  let quickPickStub: any;
  let truffleBuildStub: any;
  let hardhatBuildStub: any;

  const setupTestScenario = function (testFolderName: string, globPattern: any) {
    const foundFile = testFolderName + '/someconfig.file';
    workspace.workspaceFolders?.push({
      uri: Uri.file(testFolderName),
      index: 0,
      name: testFolderName + '-name',
    });
    // just return a truffle one... we only want to return 1
    globStub.withArgs().callsFake(function (pattern: string): string[] {
      return pattern.includes(globPattern) ? [foundFile] : [];
    });
  };

  let extensionAdapterSpy: any;

  beforeEach(async () => {
    //setup the mockery...
    workspace.workspaceFolders = [];

    truffleBuildStub = sandbox.stub(TruffleCommands, 'buildContracts');
    truffleBuildStub.returns();

    hardhatBuildStub = sandbox.stub(HardhatCommands, 'buildContracts');
    hardhatBuildStub.returns();

    fsStub = sandbox.stub(fs, 'lstatSync');
    fsStub.returns({
      isFile() {
        return true;
      },
    });

    globStub = sandbox.stub(glob, 'sync');
    // this will trigger on the last test...
    quickPickStub = sandbox.stub(AW, 'selectConfigFromQuickPick');
    quickPickStub.onFirstCall().returns({workspace: undefined});

    extensionAdapterSpy = sandbox.spy(sdkCoreCommands, 'getExtensionAdapter');
  });

  afterEach(async () => {
    sandbox.restore();
    workspace.workspaceFolders = [];
  });

  describe('WorkspaceForUri Tests', () => {
    it('will resolve workspace correctly - in a truffle folder.', async function () {
      //given - I have the default value set to goto truffle.
      const wsFolder = 'truffle-test';
      setupTestScenario(wsFolder, AW.TRUFFLE_CONFIG_GLOB);

      // when I call
      const workspaceRet = await AW.getWorkspaceForUri(Uri.file(wsFolder));

      // then the workspace will be correct
      expect(workspaceRet.dirName).to.be.eq(wsFolder);
      expect(workspaceRet.workspaceType).to.be.eq(AW.WorkspaceType.TRUFFLE);
    });

    it('will resolve workspace correctly - in a hardhat folder.', async function () {
      //given - I have the default value set to goto truffle.
      const wsFolder = 'hardhat-test';
      setupTestScenario(wsFolder, AW.HARDHAT_CONFIG_GLOB);

      // when I call the workspace resolver...
      const workspaceRet = await AW.getWorkspaceForUri(Uri.file(wsFolder));

      // then the Truffle Instances will be called.
      expect(workspaceRet.dirName).to.be.eq(wsFolder);
      expect(workspaceRet.workspaceType).to.be.eq(AW.WorkspaceType.HARDHAT);
    });

    it("will do nothing when it can't find a directory.", async function () {
      // given this base folder...
      const wsFolder = 'some-empty-folder';
      workspace.workspaceFolders?.push({
        uri: Uri.file(wsFolder),
        index: 0,
        name: wsFolder + '-name',
      });
      // return 0 workspaces with actual configs in them.
      globStub.withArgs().returns([]);

      // when I call the workspace resolver...
      const workspaceRet = await AW.getWorkspaceForUri();
      // then
      expect(workspaceRet.dirName).to.be.eq(wsFolder);
      expect(workspaceRet.workspaceType).to.be.eq(AW.WorkspaceType.UNKNOWN);
    });
  });

  describe('SDK Commands - Project Resolution', () => {
    it('will find correct command to build - truffle', async function () {
      // given - truffle workspace
      const wsFolder = 'truffle-project-1';
      const buildFolder = Uri.file(wsFolder);
      setupTestScenario(wsFolder, AW.TRUFFLE_CONFIG_GLOB);

      // when I call build
      await sdkCoreCommands.build(buildFolder);

      // then the correct methods should have been called.
      expect(extensionAdapterSpy.calledOnceWith(AW.WorkspaceType.TRUFFLE)).to.be.true;
      expect(hardhatBuildStub.notCalled).to.be.true;
      expect(truffleBuildStub.calledOnce).to.be.true;
      // console.log(`args: `, {args: truffleBuildStub.firstCall.args}); // WORKSPACE args[0]
      expect(truffleBuildStub.firstCall.args[0].dirName).to.be.eq(wsFolder);
    });

    it('will find correct command to build - hardhat', async function () {
      // given - hardhat workspace
      const wsFolder = 'hardhat-project-1';
      const buildFolder = Uri.file(wsFolder);
      setupTestScenario(wsFolder, AW.HARDHAT_CONFIG_GLOB);

      // when I call build
      await sdkCoreCommands.build(buildFolder);

      // then the correct methods should have been called.
      expect(extensionAdapterSpy.calledOnceWith(AW.WorkspaceType.HARDHAT)).to.be.true;
      expect(truffleBuildStub.notCalled).to.be.true;
      expect(hardhatBuildStub.calledOnce).to.be.true;
      // console.log(`args: `, {args: hardhatBuildStub.firstCall.args}); // WORKSPACE args[0]
      expect(hardhatBuildStub.firstCall.args[0].dirName).to.be.eq(wsFolder);
    });

    it('will find correct command to build - unknown', async function () {
      const wsFolder = 'some-empty-folder';
      const buildFolder = Uri.file(wsFolder);
      workspace.workspaceFolders?.push({
        uri: buildFolder,
        index: 0,
        name: wsFolder + '-name',
      });
      // return 0 workspaces with actual configs in them.
      globStub.withArgs().returns([]);

      // when I call build - with no contract and ultimately no configured framework workspace...
      await sdkCoreCommands.build();

      // test the unknown one was also triggered...
      expect(extensionAdapterSpy.calledOnceWith(AW.WorkspaceType.UNKNOWN)).to.be.true;
      // then unknown will be called. not the others.
      expect(truffleBuildStub.notCalled).to.be.true;
      expect(hardhatBuildStub.notCalled).to.be.true;
    });
  });
});
