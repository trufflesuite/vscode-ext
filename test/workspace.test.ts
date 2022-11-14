// Copyright (c) 2022. Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import * as AW from '@/helpers/AbstractWorkspace';
import {AbstractWorkspace, WorkspaceType} from '@/helpers/AbstractWorkspace';
import * as userInteraction from '@/helpers/userInteraction';
import {expect} from 'chai';
import fs from 'fs';
import glob from 'glob';
import sinon from 'sinon';

import {Uri, workspace} from './vscode';

type QuickPickType = {workspace: AbstractWorkspace; description: string; label: string; detail: string};

describe('Workspace - WorkspaceForUri Tests', () => {
  const sandbox = sinon.createSandbox();

  let globStub: any;
  let fsStub: any;
  // let quickPickStub: any;

  beforeEach(async () => {
    //setup the mockery...
    workspace.workspaceFolders = [];

    fsStub = sandbox.stub(fs, 'lstatSync');
    fsStub.returns({
      isFile() {
        return true;
      },
    });

    globStub = sandbox.stub(glob, 'sync');
    // this will trigger on the last test...
    // quickPickStub = sandbox.stub(AW, 'selectConfigFromQuickPick');
    // quickPickStub.throwsException('BLASDLADLASLD');
    //quickPickStub.returns(new AW.AbstractWorkspace('config.path', WorkspaceType.UNKNOWN));
  });

  afterEach(async () => {
    sandbox.restore();
    workspace.workspaceFolders = [];
  });

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

  it('will show quickpick if multiple workspace found - URI passed in.', async function () {
    // given we get no workspaces back
    const wsFolder = 'some-empty-folder';
    const buildFolder = Uri.file(wsFolder);

    workspace.workspaceFolders?.push({
      uri: buildFolder,
      index: 0,
      name: wsFolder + '-name',
    });
    globStub.withArgs().returns([]);

    const aw1 = new AW.AbstractWorkspace('blarp/bleh.conf.js', WorkspaceType.UNKNOWN);
    const aw2 = new AW.AbstractWorkspace('blorp/bleh2.conf.js', WorkspaceType.TRUFFLE);
    sandbox.stub(AW, 'findWorkspaces').returns([aw1, aw2]);

    const createQuickPickFn = sinon.stub(userInteraction, 'showQuickPick').resolves({
      workspace: aw1,
    } as QuickPickType);

    // when I try and get the workspace
    const workspaceRet = await AW.getWorkspaceForUri(Uri.file(wsFolder));

    // then I am going to hit the quickpick and return the one from there...
    expect(workspaceRet).to.be.not.undefined;
    expect(workspaceRet.workspaceType).to.be.eq(WorkspaceType.UNKNOWN);
    expect(workspaceRet.configName).to.be.eq(aw1.configName);
    expect(createQuickPickFn.called, 'createQuickPic should be called').to.be.true;
  });

  it.skip('will show quickpick if multiple workspace found - no URI passed in.', async function () {
    expect.fail('incomplete');
  });

  it.skip('will throw error when no workspaces', async function () {
    expect.fail('incomplete');
  });

  it.skip('will return first when only 1 workspace found', async function () {
    expect.fail('incomplete');
  });

  it.skip('will resolve all workspaces when no URI passed in.', async function () {
    expect.fail('incomplete');
  });

  it.skip('will skip unknown workspaces when - includeUnknown = false', () => {
    expect.fail('incomplete');
  });

  it.skip('will include unknown workspaces when - includeUnknown = true', () => {
    expect.fail('incomplete');
  });
});
