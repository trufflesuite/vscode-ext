// Copyright (c) 2022. Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import * as AW from '@/helpers/AbstractWorkspace';
import {AbstractWorkspace, resolveAllWorkspaces, WorkspaceType} from '@/helpers/AbstractWorkspace';
import * as userInteraction from '@/helpers/userInteraction';
import chai from 'chai';
import chai_as_promised from 'chai-as-promised';
import fs from 'fs';
import glob from 'glob';
import sinon from 'sinon';
import {QuickPickItem} from 'vscode';

import {Uri, workspace} from './vscode';

chai.use(chai_as_promised);
const expect = chai.expect;

type QuickPickType = {workspace: AbstractWorkspace; description: string; label: string; detail: string};

const pushWorkspace = (testFolderName: string) =>
  workspace.workspaceFolders?.push({
    uri: Uri.file(testFolderName),
    index: workspace.workspaceFolders?.length,
    name: testFolderName + '-name',
  });

describe('Workspace - WorkspaceForUri Tests', () => {
  const sandbox = sinon.createSandbox();

  let globStub: sinon.SinonStub<any[], string[]>;
  let fsStub: sinon.SinonStub<any[], any>;
  let quickPickStub: sinon.SinonStub<any[], Promise<QuickPickItem>>;

  const aw1 = new AW.AbstractWorkspace('unknown-aw1/bleh.conf.js', WorkspaceType.UNKNOWN);
  const aw2 = new AW.AbstractWorkspace('truffle-aw2/bleh2.conf.js', WorkspaceType.TRUFFLE);

  beforeEach(async () => {
    //setup the mockery...
    workspace.workspaceFolders = [];
    quickPickStub = sandbox.stub(userInteraction, 'showQuickPick');
    fsStub = sandbox.stub(fs, 'lstatSync');
    fsStub.returns({
      isFile() {
        return true;
      },
    });

    globStub = sandbox.stub(glob, 'sync');
    globStub.withArgs().returns([]);
  });

  afterEach(async () => {
    sandbox.restore();
    workspace.workspaceFolders = [];
  });

  const setupTestScenario = function (testFolderName: string, globPattern: any) {
    const foundFile = testFolderName + '/someconfig.file';
    pushWorkspace(testFolderName);
    // just return a matching one... we only want to return 1
    globStub.withArgs().callsFake(function (pattern: string): string[] {
      return pattern.includes(globPattern) ? [foundFile] : [];
    });
  };

  it('will resolve workspace correctly - in a truffle folder.', async function () {
    //given - I have the default value set.
    const wsFolder = 'truffle-test';
    setupTestScenario(wsFolder, AW.TRUFFLE_CONFIG_GLOB);

    // when I call
    const workspaceRet = await AW.getWorkspaceForUri(Uri.file(wsFolder));

    // then the workspace will be correct
    expect(workspaceRet.dirName).to.be.eq(wsFolder);
    expect(workspaceRet.workspaceType).to.be.eq(AW.WorkspaceType.TRUFFLE);
  });

  it('will resolve workspace correctly - in a hardhat folder.', async function () {
    //given - I have the default value set.
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
    pushWorkspace(wsFolder);

    // when I call the workspace resolver...
    const workspaceRet = await AW.getWorkspaceForUri();
    // then
    expect(workspaceRet.dirName).to.be.eq(wsFolder);
    expect(workspaceRet.workspaceType).to.be.eq(AW.WorkspaceType.UNKNOWN);
  });

  it('will show quickpick if multiple workspace found - URI passed in.', async function () {
    // given we get no workspaces back
    const wsFolder = 'some-empty-folder';
    pushWorkspace(wsFolder);
    sandbox.stub(AW, 'findWorkspaces').returns([aw1, aw2]);
    quickPickStub.resolves({workspace: aw1} as QuickPickType);

    // when I try and get the workspace
    const workspaceRet = await AW.getWorkspaceForUri(Uri.file(wsFolder));

    // then I am going to hit the quickpick and return the one from there...
    expect(workspaceRet).to.be.not.undefined;
    expect(workspaceRet.workspaceType).to.be.eq(WorkspaceType.UNKNOWN);
    expect(workspaceRet.configName).to.be.eq(aw1.configName);
    expect(quickPickStub.calledOnce).to.be.true;
  });

  it('will show quickpick if multiple workspace found - no URI passed in.', async function () {
    // given - I despair about testing in JS land and Sinon is about as useful as a chocolate fireguard...
    pushWorkspace('some-empty-folder');
    globStub.withArgs().callsFake(function (pattern: string): string[] {
      if (pattern.includes('hardhat')) {
        return ['hardhat1/hh-config.ts', 'hardhat2/hh-config.ts'];
      }
      return [];
    });
    quickPickStub.resolves({workspace: aw2} as QuickPickType);

    // when I try and get the workspace
    const workspaceRet = await AW.getWorkspaceForUri();

    // then I am going to hit the quickpick and return the one from there...
    expect(workspaceRet).to.be.not.undefined;
    expect(workspaceRet.workspaceType).to.be.eq(aw2.workspaceType);
    expect(workspaceRet.workspace.fsPath).to.be.eq(aw2.workspace.fsPath);
    expect(quickPickStub.calledOnce).to.be.true;
  });

  it('will throw error when no workspaces', async function () {
    expect(AW.getWorkspaceForUri()).to.eventually.be.rejectedWith(Error, 'Workspace root should be defined');
  });

  it('will return first when only 1 workspace found - no uri passed', async function () {
    //given - I have the default value set.
    const wsFolder = 'hardhat-test';
    setupTestScenario(wsFolder, AW.HARDHAT_CONFIG_GLOB);

    // when I try and get the workspace
    const workspaceRet = await AW.getWorkspaceForUri();

    // then I am going to hit the quickpick and return the one from there...
    expect(workspaceRet).to.be.not.undefined;
    expect(workspaceRet.workspaceType).to.be.eq(WorkspaceType.HARDHAT);
    expect(workspaceRet.workspace.fsPath).to.be.eq(wsFolder);
    expect(quickPickStub.notCalled).to.be.true;
  });

  it('will resolve all workspaces - 1 workspace - [UNKNOWN] - includeUnknown=true', async function () {
    // given
    pushWorkspace('test-folder-1');
    // when
    const workspaces = resolveAllWorkspaces(true);
    // then
    expect(workspaces).to.have.length(1);
    expect(workspaces[0].dirName).to.be.eq('test-folder-1');
    expect(workspaces[0].workspaceType).to.be.eq(WorkspaceType.UNKNOWN);
  });

  it('will resolve all workspaces - 1 workspace - [UNKNOWN] - includeUnknown=false', async function () {
    // given
    pushWorkspace('test-folder-1');
    // when
    const workspaces = resolveAllWorkspaces(false);
    // then
    expect(workspaces).to.have.length(0);
  });

  it('will resolve all workspaces - 2 workspaces - [UNKNOWN, TRUFFLE] - includeUnknown=true', async function () {
    // given
    pushWorkspace('test-folder-1');
    pushWorkspace('test-folder-2');
    // map one to be truffle
    globStub.withArgs(`/test-folder-2/**/${AW.TRUFFLE_CONFIG_GLOB}`).returns(['test-folder-2/gosh-this-is-hard.js']);
    globStub.returns([]);

    // when
    const workspaces = resolveAllWorkspaces(true);
    // then
    expect(workspaces).to.have.length(2);

    expect(workspaces[0].dirName).to.be.eq('test-folder-1');
    expect(workspaces[0].workspaceType).to.be.eq(WorkspaceType.UNKNOWN);

    expect(workspaces[1].dirName).to.be.eq('test-folder-2');
    expect(workspaces[1].configName).to.be.eq('gosh-this-is-hard.js');
    expect(workspaces[1].workspaceType).to.be.eq(WorkspaceType.TRUFFLE);
  });

  it('will resolve all workspaces - 2 workspaces - [UNKNOWN, TRUFFLE] - includeUnknown=false', async function () {
    // given
    pushWorkspace('test-folder-1');
    pushWorkspace('test-folder-2');
    // map one to be truffle
    globStub.withArgs(`/test-folder-2/**/${AW.TRUFFLE_CONFIG_GLOB}`).returns(['test-folder-2/gosh-this-is-hard.js']);
    globStub.returns([]);

    // when
    const workspaces = resolveAllWorkspaces(false);
    // then
    expect(workspaces).to.have.length(1);
    expect(workspaces[0].dirName).to.be.eq('test-folder-2');
    expect(workspaces[0].configName).to.be.eq('gosh-this-is-hard.js');
    expect(workspaces[0].workspaceType).to.be.eq(WorkspaceType.TRUFFLE);
  });
});
