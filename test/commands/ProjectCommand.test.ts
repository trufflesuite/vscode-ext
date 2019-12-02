// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as assert from 'assert';
import * as fs from 'fs-extra';
import rewire = require('rewire');
import * as sinon from 'sinon';
import { CancellationToken, Progress, ProgressOptions, window, workspace } from 'vscode';
import { Constants, RequiredApps } from '../../src/Constants';
import * as helpers from '../../src/helpers';
import { CancellationEvent } from '../../src/Models';
import { Output } from '../../src/Output';

describe('ProjectCommands', () => {
  describe('Unit tests', () => {
    const projectPath = 'projectPath';
    const truffleBoxName = 'truffleBoxName';

    describe('newSolidityProject', () => {
      let helpersMock: sinon.SinonMock;
      let gitHelperMock: sinon.SinonMock;
      let showQuickPickMock: sinon.SinonStub<any[], any>;
      let gitInitMock: sinon.SinonStub<any[], any>;
      let requiredMock: sinon.SinonMock;
      let checkRequiredAppsMock: sinon.SinonExpectation;
      let withProgressStub: sinon.SinonStub<
        [ProgressOptions, (progress: Progress<any>, token: CancellationToken) => any], any>;

      beforeEach(() => {
        helpersMock = sinon.mock(helpers);
        showQuickPickMock = helpersMock.expects('showQuickPick').returns({
          cmd: () => undefined,
          label: 'emptyProject',
        });
        gitHelperMock = sinon.mock(helpers.gitHelper);
        gitInitMock = gitHelperMock.expects('gitInit').returns(() => undefined);
        requiredMock = sinon.mock(helpers.required);
        checkRequiredAppsMock = requiredMock.expects('checkRequiredApps');

        withProgressStub = sinon.stub(window, 'withProgress');
        withProgressStub.callsFake(async (...args: any[]) => {
          return args[1]();
        });
      });

      afterEach(() => {
        requiredMock.restore();
        gitHelperMock.restore();
        helpersMock.restore();
        withProgressStub.restore();
      });

      it('Method newSolidityProject does not provide type of new project, because we have not required apps.',
        async () => {
        // Arrange
        checkRequiredAppsMock.returns(false);
        const projectCommandsRewire = rewire('../../src/commands/ProjectCommands');
        projectCommandsRewire.__set__('chooseNewProjectDir', sinon.mock().returns(''));
        const chooseNewProjectDirMock = projectCommandsRewire.__get__('chooseNewProjectDir');

        // Act
        await projectCommandsRewire.ProjectCommands.newSolidityProject();

        // Assert
        assert.strictEqual(checkRequiredAppsMock.calledOnce, true, 'checkRequiredApps should be called once');
        assert.strictEqual(showQuickPickMock.notCalled, true, 'showQuickPick should not be called');
        assert.strictEqual(chooseNewProjectDirMock.notCalled, true, 'chooseNewProjectDir should not be called');
        assert.strictEqual(gitInitMock.notCalled, true, 'gitInit should not be called');
      });

      it('Method newSolidityProject provide type of new project, because we have all required apps.', async () => {
        // Arrange
        checkRequiredAppsMock.returns(true);
        const projectCommandsRewire = rewire('../../src/commands/ProjectCommands');
        projectCommandsRewire.__set__('chooseNewProjectDir', sinon.mock().returns(projectPath));
        const chooseNewProjectDirMock = projectCommandsRewire.__get__('chooseNewProjectDir');

        // Act
        await projectCommandsRewire.ProjectCommands.newSolidityProject();

        // Assert
        assert.strictEqual(checkRequiredAppsMock.calledOnce, true, 'checkRequiredApps should be called once');
        assert.strictEqual(showQuickPickMock.calledOnce, true, 'showQuickPick should be called once');
        assert.strictEqual(chooseNewProjectDirMock.calledOnce, true, 'chooseNewProjectDir should be called once');
        assert.strictEqual(gitInitMock.calledOnce, true, 'gitInit should be called once');
        assert.strictEqual(gitInitMock.args[0][0], projectPath, 'git init should be called with correct arguments');
      });
    });

    describe('chooseNewProjectDir', () => {
      let helpersMock: sinon.SinonMock;
      const firstProjectPath = 'firstProjectPath';
      const secondProjectPath = 'secondProjectPath';
      let fsMock: sinon.SinonMock;
      let windowMock: sinon.SinonMock;
      let showOpenFolderDialogMock: sinon.SinonExpectation;
      let ensureDirMock: sinon.SinonExpectation;
      let readdirMock: sinon.SinonExpectation;
      let showErrorMessageMock: sinon.SinonStub<any[], any>;

      beforeEach(() => {
        helpersMock = sinon.mock(helpers);
        showOpenFolderDialogMock = helpersMock.expects('showOpenFolderDialog');
        showOpenFolderDialogMock.twice();
        showOpenFolderDialogMock.onCall(0).returns(firstProjectPath);
        showOpenFolderDialogMock.onCall(1).returns(secondProjectPath);

        fsMock = sinon.mock(fs);
        ensureDirMock = fsMock.expects('ensureDir');
        readdirMock = fsMock.expects('readdir');

        windowMock = sinon.mock(window);
        showErrorMessageMock = windowMock.expects('showErrorMessage');
      });

      afterEach(() => {
        sinon.restore();
      });

      it('Method chooseNewProjectDir returns projectPath which we selected', async () => {
        // Arrange
        readdirMock.returns([]);
        const projectCommandsRewire = rewire('../../src/commands/ProjectCommands');
        const chooseNewProjectDir = projectCommandsRewire.__get__('chooseNewProjectDir');

        // Act
        const newProjectPath = await chooseNewProjectDir();

        // Assert
        assert.strictEqual(showOpenFolderDialogMock.calledOnce, true, 'showOpenFolderDialog should be called once');
        assert.strictEqual(ensureDirMock.calledOnce, true, 'ensureDir should be called once');
        assert.strictEqual(
          ensureDirMock.args[0][0],
          firstProjectPath,
          'ensureDir should be called with correct arguments');
        assert.strictEqual(readdirMock.calledOnce, true, 'readdir should be called once');
        assert.strictEqual(readdirMock.args[0][0], firstProjectPath, 'readdir should be called with correct arguments');
        assert.strictEqual(newProjectPath, firstProjectPath, 'newProjectPath should be equal to firstProjectPath');
        assert.strictEqual(showErrorMessageMock.notCalled, true, 'showErrorMessage should not be called');
      });

      it('Method chooseNewProjectDir returns projectPath at second time, because we selected not empty dir ' +
      'at first time.', async () => {
        // Arrange
        ensureDirMock.twice();
        readdirMock.twice();
        readdirMock.onCall(0).returns(['somePath']);
        readdirMock.onCall(1).returns([]);

        const projectCommandsRewire = rewire('../../src/commands/ProjectCommands');
        const chooseNewProjectDir = projectCommandsRewire.__get__('chooseNewProjectDir');
        showErrorMessageMock.returns(Constants.informationMessage.openButton);

        // Act
        const newProjectPath = await chooseNewProjectDir();

        // Assert
        assert.strictEqual(showOpenFolderDialogMock.calledTwice, true, 'showOpenFolderDialog should be called twice');
        assert.strictEqual(ensureDirMock.calledTwice, true, 'ensureDir should be called twice');
        assert.strictEqual(
          ensureDirMock.firstCall.args[0],
          firstProjectPath,
          'ensureDir should be called with correct arguments');
        assert.strictEqual(
          ensureDirMock.secondCall.args[0],
          secondProjectPath,
          'ensureDir should be called with correct arguments');
        assert.strictEqual(readdirMock.calledTwice, true, 'readdir should be called once');
        assert.strictEqual(
          readdirMock.firstCall.args[0],
          firstProjectPath,
          'readdir should be called with correct arguments');
        assert.strictEqual(
          readdirMock.secondCall.args[0],
          secondProjectPath,
          'readdir should be called with correct arguments');
        assert.strictEqual(newProjectPath, secondProjectPath, 'newProjectPath should be equal to secondProjectPath');
        assert.strictEqual(showErrorMessageMock.calledOnce, true, 'showErrorMessage should be called once');
      });

      it('Method chooseNewProjectDir throws CancellationEvent, because user click on Cancel button', async () => {
        // Arrange
        readdirMock.returns(['somePath']);
        const projectCommandsRewire = rewire('../../src/commands/ProjectCommands');
        const chooseNewProjectDir = projectCommandsRewire.__get__('chooseNewProjectDir');
        showErrorMessageMock.returns(Constants.informationMessage.cancelButton);

        // Act
        const action = async () => {
          return await chooseNewProjectDir();
        };

        // Assert
        await assert.rejects(action, CancellationEvent);
        assert.strictEqual(showOpenFolderDialogMock.calledOnce, true, 'showOpenFolderDialog should be called once');
        assert.strictEqual(ensureDirMock.calledOnce, true, 'ensureDir should be called once');
        assert.strictEqual(
          ensureDirMock.args[0][0],
          firstProjectPath,
          'ensureDir should be called with correct arguments');
        assert.strictEqual(readdirMock.calledOnce, true, 'readdir should be called once');
        assert.strictEqual(readdirMock.args[0][0], firstProjectPath, 'readdir should be called with correct arguments');
        assert.strictEqual(showErrorMessageMock.calledOnce, true, 'showErrorMessage should be called once');
      });
    });

    describe('createNewEmptyProject', () => {
      let withProgressStub: sinon.SinonStub<
        [ProgressOptions, (progress: Progress<any>, token: CancellationToken) => any], any>;

      beforeEach(() => {
        withProgressStub = sinon.stub(window, 'withProgress');
      });

      afterEach(() => {
        withProgressStub.restore();
      });

      it('Method createNewEmptyProject runs method createProject.', async () => {
        // Arrange
        const projectCommandsRewire = rewire('../../src/commands/ProjectCommands');
        const createNewEmptyProject = projectCommandsRewire.__get__('createNewEmptyProject');

        // Act
        await createNewEmptyProject(projectPath);

        // Assert
        assert.strictEqual(withProgressStub.calledOnce, true, 'withProgress should be called once');
      });
    });

    it('Method createProjectFromTruffleBox runs method createProject with special truffle box name.', async () => {
      // Arrange
      const projectCommandsRewire = rewire('../../src/commands/ProjectCommands');
      const createProjectFromTruffleBox = projectCommandsRewire.__get__('createProjectFromTruffleBox');
      projectCommandsRewire.__set__('getTruffleBoxName', sinon.mock().returns(truffleBoxName));
      const getTruffleBoxNameMock = projectCommandsRewire.__get__('getTruffleBoxName');
      projectCommandsRewire.__set__('createProject', sinon.mock());
      const createProjectMock = projectCommandsRewire.__get__('createProject');

      // Act
      await createProjectFromTruffleBox(projectPath);

      // Assert
      assert.strictEqual(getTruffleBoxNameMock.calledOnce, true, 'getTruffleBoxName should be called once');
      assert.strictEqual(createProjectMock.calledOnce, true, 'createProject should be called once');
      assert.strictEqual(createProjectMock.args[0][0],
        projectPath,
        'createProject should be called with correct arguments');
      assert.strictEqual(
        createProjectMock.args[0][1],
        truffleBoxName,
        'createProject should be called with correct arguments');
    });

    describe('createProject', () => {
      let outputCommandHelperMock: sinon.SinonMock;
      let executeCommandMock: sinon.SinonExpectation;
      let workspaceMock: sinon.SinonMock;
      let updateWorkspaceFoldersMock: sinon.SinonExpectation;
      let fsMock: sinon.SinonMock;
      let emptyDirSyncMock: sinon.SinonExpectation;

      beforeEach(() => {
        outputCommandHelperMock = sinon.mock(helpers.outputCommandHelper);
        executeCommandMock = outputCommandHelperMock.expects('executeCommand');
        workspaceMock = sinon.mock(workspace);
        updateWorkspaceFoldersMock = workspaceMock.expects('updateWorkspaceFolders');
        fsMock = sinon.mock(fs);
        emptyDirSyncMock = fsMock.expects('emptyDirSync');
      });

      afterEach(() => {
        sinon.restore();
      });

      it('Method createProject run command for create new project and project was created successfully. ' +
      'Workspace was updated to certain workspace.', async () => {
        // Arrange
        sinon.stub(workspace, 'workspaceFolders').value(['1']);
        const projectCommandsRewire = rewire('../../src/commands/ProjectCommands');
        const createProject = projectCommandsRewire.__get__('createProject');

        // Act
        await createProject(projectPath, truffleBoxName);

        // Assert
        assert.strictEqual(executeCommandMock.calledOnce, true, 'executeCommand should be called once');
        assert.strictEqual(
          executeCommandMock.args[0][0],
          projectPath,
          'executeCommand should be called with correct arguments');
        assert.strictEqual(
          executeCommandMock.args[0][1],
          'npx',
          'executeCommand should be called with correct arguments');
        assert.strictEqual(
          executeCommandMock.args[0][2],
          RequiredApps.truffle,
          'executeCommand should be called with correct arguments');
        assert.strictEqual(
          executeCommandMock.args[0][3],
          'unbox',
          'executeCommand should be called with correct arguments');
        assert.strictEqual(
          executeCommandMock.args[0][4],
          truffleBoxName,
          'executeCommand should be called with correct arguments');
        assert.strictEqual(updateWorkspaceFoldersMock.calledOnce, true, 'updateWorkspaceFolders should be called once');
        assert.strictEqual(
          updateWorkspaceFoldersMock.args[0][0],
          0,
          'updateWorkspaceFolders should be called with correct arguments');
        assert.strictEqual(
          updateWorkspaceFoldersMock.args[0][1],
          1,
          'updateWorkspaceFolders should be called with correct arguments');
        assert.strictEqual(
          updateWorkspaceFoldersMock.args[0][2].uri.path,
          `/${projectPath}`,
          'updateWorkspaceFolders should be called with correct arguments');
        assert.strictEqual(emptyDirSyncMock.notCalled, true, 'emptyDirSync should not be called');
      });

      it('Method createProject run command for create new project and project was created successfully. ' +
      'Workspace was not updated to certain workspace.', async () => {
        // Arrange
        sinon.stub(workspace, 'workspaceFolders').value(undefined);
        const projectCommandsRewire = rewire('../../src/commands/ProjectCommands');
        const createProject = projectCommandsRewire.__get__('createProject');

        // Act
        await createProject(projectPath, truffleBoxName);

        // Assert
        assert.strictEqual(executeCommandMock.calledOnce, true, 'executeCommand should be called once');
        assert.strictEqual(
          executeCommandMock.args[0][0],
          projectPath,
          'executeCommand should be called with correct arguments');
        assert.strictEqual(
          executeCommandMock.args[0][1],
          'npx',
          'executeCommand should be called with correct arguments');
        assert.strictEqual(
          executeCommandMock.args[0][2],
          RequiredApps.truffle,
          'executeCommand should be called with correct arguments');
        assert.strictEqual(
          executeCommandMock.args[0][3],
          'unbox',
          'executeCommand should be called with correct arguments');
        assert.strictEqual(
          executeCommandMock.args[0][4],
          truffleBoxName,
          'executeCommand should be called with correct arguments');
        assert.strictEqual(updateWorkspaceFoldersMock.calledOnce, true, 'updateWorkspaceFolders should be called once');
        assert.strictEqual(
          updateWorkspaceFoldersMock.args[0][0],
          0,
          'updateWorkspaceFolders should be called with correct arguments');
        assert.strictEqual(
          updateWorkspaceFoldersMock.args[0][1],
          null,
          'updateWorkspaceFolders should be called with correct arguments');
        assert.strictEqual(
          updateWorkspaceFoldersMock.args[0][2].uri.path,
          `/${projectPath}`,
          'updateWorkspaceFolders should be called with correct arguments');
        assert.strictEqual(emptyDirSyncMock.notCalled, true, 'emptyDirSync should not be called');
      });

      it('Method createProject run command for create new project and creation was fell of project.', async () => {
        // Arrange
        executeCommandMock.throws();
        const projectCommandsRewire = rewire('../../src/commands/ProjectCommands');
        const createProject = projectCommandsRewire.__get__('createProject');

        // Act
        const action = async () => {
          await createProject(projectPath, truffleBoxName);
        };

        // Assert
        await assert.rejects(
          action,
          Error,
          Constants.errorMessageStrings.NewProjectCreationFailed);
        assert.strictEqual(executeCommandMock.calledOnce, true, 'executeCommand should be called once');
        assert.strictEqual(
          executeCommandMock.args[0][0],
          projectPath,
          'executeCommand should be called with correct arguments');
        assert.strictEqual(
          executeCommandMock.args[0][1],
          'npx',
          'executeCommand should be called with correct arguments');
        assert.strictEqual(
          executeCommandMock.args[0][2],
          RequiredApps.truffle,
          'executeCommand should be called with correct arguments');
        assert.strictEqual(
          executeCommandMock.args[0][3],
          'unbox',
          'executeCommand should be called with correct arguments');
        assert.strictEqual(
          executeCommandMock.args[0][4],
          truffleBoxName,
          'executeCommand should be called with correct arguments');
        assert.strictEqual(updateWorkspaceFoldersMock.notCalled, true, 'updateWorkspaceFolders should not be called');
        assert.strictEqual(emptyDirSyncMock.calledOnce, true, 'emptyDirSync should be called once');
        assert.strictEqual(
          emptyDirSyncMock.args[0][0],
          projectPath,
          'emptyDirSync should be called with correct arguments');
      });
    });

    it('Method getTruffleBoxName should return a value', async () => {
      // Arrange
      const helpersMock = sinon.mock(helpers);
      const testName = 'test';
      const projectCommandsRewire = rewire('../../src/commands/ProjectCommands');
      const getTruffleBoxName = projectCommandsRewire.__get__('getTruffleBoxName');
      const showInputBoxMock = helpersMock.expects('showInputBox');

      showInputBoxMock.returns(testName);

      // Act
      const result = await getTruffleBoxName();

      // Assert
      assert.strictEqual(result, testName, 'result should be equal to expected string');
      assert.strictEqual(showInputBoxMock.calledOnce, true, 'showInputBox should be called once');
    });
  });

  describe('Integration tests', () => {
    let helpersMock: sinon.SinonMock;
    const truffleBoxName = 'truffleBoxName';
    const firstProjectPath = 'firstProjectPath';
    const secondProjectPath = 'secondProjectPath';

    let gitHelperMock: sinon.SinonMock;
    let showQuickPickMock: sinon.SinonStub<any[], any>;
    let gitInitMock: sinon.SinonStub<any[], any>;
    let requiredMock: sinon.SinonMock;
    let checkRequiredAppsMock: sinon.SinonExpectation;
    let fsMock: sinon.SinonMock;
    let windowMock: sinon.SinonMock;
    let showOpenFolderDialogMock: sinon.SinonExpectation;
    let ensureDirMock: sinon.SinonExpectation;
    let readdirMock: sinon.SinonExpectation;
    let showErrorMessageMock: sinon.SinonStub<any[], any>;
    let outputCommandHelperMock: sinon.SinonMock;
    let executeCommandMock: sinon.SinonExpectation;
    let outputMock: sinon.SinonMock;
    let workspaceMock: sinon.SinonMock;
    let updateWorkspaceFoldersMock: sinon.SinonExpectation;
    let emptyDirSyncMock: sinon.SinonExpectation;
    let withProgressStub: sinon.SinonStub<
      [ProgressOptions, (progress: Progress<any>, token: CancellationToken) => any], any>;

    beforeEach(() => {
      helpersMock = sinon.mock(helpers);
      showQuickPickMock = helpersMock.expects('showQuickPick');
      gitHelperMock = sinon.mock(helpers.gitHelper);
      gitInitMock = gitHelperMock.expects('gitInit').returns(() => undefined);
      requiredMock = sinon.mock(helpers.required);
      checkRequiredAppsMock = requiredMock.expects('checkRequiredApps');
      outputCommandHelperMock = sinon.mock(helpers.outputCommandHelper);
      executeCommandMock = outputCommandHelperMock.expects('executeCommand');

      showOpenFolderDialogMock = helpersMock.expects('showOpenFolderDialog');
      showOpenFolderDialogMock.twice();
      showOpenFolderDialogMock.onCall(0).returns(firstProjectPath);
      showOpenFolderDialogMock.onCall(1).returns(secondProjectPath);

      fsMock = sinon.mock(fs);
      ensureDirMock = fsMock.expects('ensureDir');
      readdirMock = fsMock.expects('readdir');
      emptyDirSyncMock = fsMock.expects('emptyDirSync');

      windowMock = sinon.mock(window);
      showErrorMessageMock = windowMock.expects('showErrorMessage');
      workspaceMock = sinon.mock(workspace);
      updateWorkspaceFoldersMock = workspaceMock.expects('updateWorkspaceFolders');

      outputMock = sinon.mock(Output);

      withProgressStub = sinon.stub(window, 'withProgress');
      withProgressStub.callsFake(async (...args: any[]) => {
        return args[1]();
      });
    });

    afterEach(() => {
      requiredMock.restore();
      gitHelperMock.restore();
      helpersMock.restore();
      fsMock.restore();
      windowMock.restore();
      outputMock.restore();
      outputCommandHelperMock.restore();
      workspaceMock.restore();
      withProgressStub.restore();
    });

    it('Method chooseNewProjectDir returns projectPath which we selected at second time.', async () => {
      // Arrange
      checkRequiredAppsMock.returns(true);
      ensureDirMock.twice();
      readdirMock.twice();
      readdirMock.onCall(0).returns(['somePath']);
      readdirMock.onCall(1).returns([]);
      showQuickPickMock.returns({
        cmd: () => undefined,
        label: 'emptyProject',
      });
      const projectCommandsRewire = rewire('../../src/commands/ProjectCommands');
      showErrorMessageMock.returns(Constants.informationMessage.openButton);

      // Act
      await projectCommandsRewire.ProjectCommands.newSolidityProject();

      // Assert
      assert.strictEqual(checkRequiredAppsMock.calledOnce, true, 'checkRequiredApps should be called once');
      assert.strictEqual(showQuickPickMock.calledOnce, true, 'showQuickPick should be called once');
      assert.strictEqual(gitInitMock.calledOnce, true, 'gitInit should be called once');
      assert.strictEqual(gitInitMock.args[0][0], secondProjectPath, 'gitInit should be called with correct arguments');
      assert.strictEqual(showOpenFolderDialogMock.calledTwice, true, 'showOpenFolderDialog should be called twice');
      assert.strictEqual(ensureDirMock.calledTwice, true, 'ensureDir should be called twice');
      assert.strictEqual(
        ensureDirMock.firstCall.args[0],
        firstProjectPath,
        'ensureDir should be called with correct arguments');
      assert.strictEqual(
        ensureDirMock.secondCall.args[0],
        secondProjectPath,
        'ensureDir should be called with correct arguments');
      assert.strictEqual(readdirMock.calledTwice, true, 'readdir should be called once');
      assert.strictEqual(
        readdirMock.firstCall.args[0],
        firstProjectPath,
        'readdir should be called with correct arguments');
      assert.strictEqual(
        readdirMock.secondCall.args[0],
        secondProjectPath,
        'readdir should be called with correct arguments');
      assert.strictEqual(showErrorMessageMock.calledOnce, true, 'showErrorMessage should be called once');
    });

    it('Method chooseNewProjectDir returns projectPath which we selected at first time.', async () => {
      // Arrange
      checkRequiredAppsMock.returns(true);
      sinon.stub(workspace, 'workspaceFolders').value(['1']);
      readdirMock.returns([]);
      showQuickPickMock.returns({
        cmd: () => undefined,
        label: 'emptyProject',
      });
      const projectCommandsRewire = rewire('../../src/commands/ProjectCommands');

      // Act
      await projectCommandsRewire.ProjectCommands.newSolidityProject();

      // Assert
      assert.strictEqual(checkRequiredAppsMock.calledOnce, true, 'checkRequiredApps should be called once');
      assert.strictEqual(showQuickPickMock.calledOnce, true, 'showQuickPick should be called once');
      assert.strictEqual(gitInitMock.calledOnce, true, 'gitInit should be called once');
      assert.strictEqual(gitInitMock.args[0][0], firstProjectPath, 'gitInit should be called with correct arguments');
      assert.strictEqual(showOpenFolderDialogMock.calledOnce, true, 'showOpenFolderDialog should be called once');
      assert.strictEqual(ensureDirMock.calledOnce, true, 'ensureDir should be called once');
      assert.strictEqual(
        ensureDirMock.args[0][0],
        firstProjectPath,
        'ensureDir should be called with correct arguments');
      assert.strictEqual(readdirMock.calledOnce, true, 'readdir should be called once');
      assert.strictEqual(readdirMock.args[0][0], firstProjectPath, 'readdir should be called with correct arguments');
      assert.strictEqual(showErrorMessageMock.notCalled, true, 'showErrorMessage should not be called');
    });

    it('Method createNewEmptyProject runs method createProject, and new empty project was created successfully.',
    async () => {
      // Arrange
      checkRequiredAppsMock.returns(true);
      readdirMock.returns([]);
      sinon.stub(workspace, 'workspaceFolders').value(['1']);

      const projectCommandsRewire = rewire('../../src/commands/ProjectCommands');
      const createNewEmptyProject = projectCommandsRewire.__get__('createNewEmptyProject');

      showErrorMessageMock.returns(Constants.informationMessage.openButton);
      showQuickPickMock.returns({
        cmd: createNewEmptyProject,
        label: Constants.typeOfSolidityProject.text.emptyProject,
      });

      // Act
      await projectCommandsRewire.ProjectCommands.newSolidityProject();

      // Assert
      assert.strictEqual(checkRequiredAppsMock.calledOnce, true, 'checkRequiredApps should be called once');
      assert.strictEqual(showQuickPickMock.calledOnce, true, 'showQuickPick should be called once');
      assert.strictEqual(gitInitMock.calledOnce, true, 'gitInit should be called once');
      assert.strictEqual(gitInitMock.args[0][0], firstProjectPath, 'gitInit should be called with correct arguments');
      assert.strictEqual(showOpenFolderDialogMock.calledOnce, true, 'showOpenFolderDialog should be called once');
      assert.strictEqual(ensureDirMock.calledOnce, true, 'ensureDir should be called once');
      assert.strictEqual(
        ensureDirMock.args[0][0],
        firstProjectPath,
        'ensureDir should be called with correct arguments');
      assert.strictEqual(readdirMock.calledOnce, true, 'readdir should be called once');
      assert.strictEqual(readdirMock.args[0][0], firstProjectPath, 'readdir should be called with correct arguments');
      assert.strictEqual(showErrorMessageMock.notCalled, true, 'showErrorMessage should not be called');
      assert.strictEqual(executeCommandMock.calledOnce, true, 'executeCommand should be called once');
      assert.strictEqual(
        executeCommandMock.args[0][0],
        firstProjectPath,
        'executeCommand should be called with correct arguments');
      assert.strictEqual(
        executeCommandMock.args[0][1],
        'npx',
        'executeCommand should be called with correct arguments');
      assert.strictEqual(
        executeCommandMock.args[0][2],
        RequiredApps.truffle,
        'executeCommand should be called with correct arguments');
      assert.strictEqual(
        executeCommandMock.args[0][3],
        'unbox',
        'executeCommand should be called with correct arguments');
      assert.strictEqual(
        executeCommandMock.args[0][4],
        Constants.defaultTruffleBox,
        'executeCommand should be called with correct arguments');
      assert.strictEqual(updateWorkspaceFoldersMock.calledOnce, true, 'updateWorkspaceFolders should be called once');
      assert.strictEqual(
        updateWorkspaceFoldersMock.args[0][0],
        0,
        'updateWorkspaceFolders should be called with correct arguments');
      assert.strictEqual(
        updateWorkspaceFoldersMock.args[0][1],
        1,
        'updateWorkspaceFolders should be called with correct arguments');
      assert.strictEqual(
        updateWorkspaceFoldersMock.args[0][2].uri.path,
        `/${firstProjectPath}`,
        'updateWorkspaceFolders should be called with correct arguments');
      assert.strictEqual(emptyDirSyncMock.notCalled, true, 'emptyDirSync should not be called');
    });

    it('Method createNewEmptyProject runs method createProject, and method createProject throws error.',
    async () => {
      // Arrange
      checkRequiredAppsMock.returns(true);
      readdirMock.returns([]);
      executeCommandMock.throws();

      const projectCommandsRewire = rewire('../../src/commands/ProjectCommands');
      const createNewEmptyProject = projectCommandsRewire.__get__('createNewEmptyProject');
      showErrorMessageMock.returns(Constants.informationMessage.openButton);
      showQuickPickMock.returns({
        cmd: createNewEmptyProject,
        label: Constants.typeOfSolidityProject.text.emptyProject,
      });

      // Act
      const action = async () => {
        await projectCommandsRewire.ProjectCommands.newSolidityProject();
      };

      // Assert
      await assert.rejects(
        action,
        Error,
        Constants.errorMessageStrings.NewProjectCreationFailed);
      assert.strictEqual(checkRequiredAppsMock.calledOnce, true, 'checkRequiredApps should be called once');
      assert.strictEqual(showQuickPickMock.calledOnce, true, 'showQuickPick should be called once');
      assert.strictEqual(gitInitMock.notCalled, true, 'gitInit should not be called');
      assert.strictEqual(showOpenFolderDialogMock.calledOnce, true, 'showOpenFolderDialog should be called once');
      assert.strictEqual(ensureDirMock.calledOnce, true, 'ensureDir should be called once');
      assert.strictEqual(
        ensureDirMock.args[0][0],
        firstProjectPath,
        'ensureDir should be called with correct arguments');
      assert.strictEqual(readdirMock.calledOnce, true, 'readdir should be called once');
      assert.strictEqual(readdirMock.args[0][0], firstProjectPath, 'readdir should be called with correct arguments');
      assert.strictEqual(showErrorMessageMock.notCalled, true, 'showErrorMessage should not be called');
      assert.strictEqual(executeCommandMock.calledOnce, true, 'executeCommand should be called once');
      assert.strictEqual(
        executeCommandMock.args[0][0],
        firstProjectPath,
        'executeCommand should be called with correct arguments');
      assert.strictEqual(
        executeCommandMock.args[0][1],
        'npx',
        'executeCommand should be called with correct arguments');
      assert.strictEqual(
        executeCommandMock.args[0][2],
        RequiredApps.truffle,
        'executeCommand should be called with correct arguments');
      assert.strictEqual(
        executeCommandMock.args[0][3],
        'unbox',
        'executeCommand should be called with correct arguments');
      assert.strictEqual(
        executeCommandMock.args[0][4],
        Constants.defaultTruffleBox,
        'executeCommand should be called with correct arguments');
      assert.strictEqual(updateWorkspaceFoldersMock.notCalled, true, 'updateWorkspaceFolders should not be called');
      assert.strictEqual(emptyDirSyncMock.calledOnce, true, 'emptyDirSync should be called once');
      assert.strictEqual(
        emptyDirSyncMock.args[0][0],
        firstProjectPath,
        'emptyDirSync should be called with correct arguments');
    });

    it('Method createProjectFromTruffleBox get truffleBoxName and create new project with this name.',
    async () => {
      // Arrange
      checkRequiredAppsMock.returns(true);
      readdirMock.returns([]);
      sinon.stub(workspace, 'workspaceFolders').value(['1']);

      const projectCommandsRewire = rewire('../../src/commands/ProjectCommands');
      projectCommandsRewire.__set__('getTruffleBoxName', sinon.mock().returns(truffleBoxName));
      const getTruffleBoxNameMock = projectCommandsRewire.__get__('getTruffleBoxName');
      const createProjectFromTruffleBox = projectCommandsRewire.__get__('createProjectFromTruffleBox');

      showErrorMessageMock.returns(Constants.informationMessage.openButton);
      showQuickPickMock.returns({
        cmd: createProjectFromTruffleBox,
        label: Constants.typeOfSolidityProject.text.projectFromTruffleBox,
      });

      // Act
      await projectCommandsRewire.ProjectCommands.newSolidityProject();

      // Assert
      assert.strictEqual(checkRequiredAppsMock.calledOnce, true, 'checkRequiredApps should be called once');
      assert.strictEqual(showQuickPickMock.calledOnce, true, 'showQuickPick should be called once');
      assert.strictEqual(gitInitMock.calledOnce, true, 'gitInit should be called once');
      assert.strictEqual(getTruffleBoxNameMock.calledOnce, true, 'getTruffleBoxName should be called once');
      assert.strictEqual(gitInitMock.args[0][0], firstProjectPath);
      assert.strictEqual(showOpenFolderDialogMock.calledOnce, true, 'showOpenFolderDialog should be called once');
      assert.strictEqual(ensureDirMock.calledOnce, true, 'ensureDir should be called once');
      assert.strictEqual(
        ensureDirMock.args[0][0],
        firstProjectPath,
        'ensureDir should be called with correct arguments');
      assert.strictEqual(readdirMock.calledOnce, true, 'readdir should be called once');
      assert.strictEqual(readdirMock.args[0][0], firstProjectPath, 'readdir should be called with correct arguments');
      assert.strictEqual(showErrorMessageMock.notCalled, true, 'showErrorMessage should not be called');
      assert.strictEqual(executeCommandMock.calledOnce, true, 'executeCommand should be called once');
      assert.strictEqual(
        executeCommandMock.args[0][0],
        firstProjectPath,
        'executeCommand should be called with correct arguments');
      assert.strictEqual(
        executeCommandMock.args[0][1],
        'npx',
        'executeCommand should be called with correct arguments');
      assert.strictEqual(
        executeCommandMock.args[0][2],
        RequiredApps.truffle,
        'executeCommand should be called with correct arguments');
      assert.strictEqual(
        executeCommandMock.args[0][3],
        'unbox',
        'executeCommand should be called with correct arguments');
      assert.strictEqual(
        executeCommandMock.args[0][4],
        truffleBoxName,
        'executeCommand should be called with correct arguments');
      assert.strictEqual(updateWorkspaceFoldersMock.calledOnce, true, 'updateWorkspaceFolders should be called once');
      assert.strictEqual(
        updateWorkspaceFoldersMock.args[0][0],
        0,
        'updateWorkspaceFolders should be called with correct arguments');
      assert.strictEqual(
        updateWorkspaceFoldersMock.args[0][1],
        1,
        'updateWorkspaceFolders should be called with correct arguments');
      assert.strictEqual(
        updateWorkspaceFoldersMock.args[0][2].uri.path,
        `/${firstProjectPath}`,
        'updateWorkspaceFolders should be called with correct arguments');
      assert.strictEqual(emptyDirSyncMock.notCalled, true, 'emptyDirSync should not be called');
    });

    it('Method createProjectFromTruffleBox get truffleBoxName and create new project with this name. ' +
    'showInputBox called twice in getTruffleBoxName.', async () => {
      // Arrange
      checkRequiredAppsMock.returns(true);
      readdirMock.returns([]);
      executeCommandMock.throws();

      const projectCommandsRewire = rewire('../../src/commands/ProjectCommands');
      projectCommandsRewire.__set__('getTruffleBoxName', sinon.mock().returns(truffleBoxName));
      const getTruffleBoxNameMock = projectCommandsRewire.__get__('getTruffleBoxName');
      const createProjectFromTruffleBox = projectCommandsRewire.__get__('createProjectFromTruffleBox');
      showErrorMessageMock.returns(Constants.informationMessage.openButton);
      showQuickPickMock.returns({
        cmd: createProjectFromTruffleBox,
        label: Constants.typeOfSolidityProject.text.projectFromTruffleBox,
      });

      // Act
      const action = async () => {
        await projectCommandsRewire.ProjectCommands.newSolidityProject();
      };

      // Assert
      await assert.rejects(
        action,
        Error,
        Constants.errorMessageStrings.NewProjectCreationFailed);
      assert.strictEqual(checkRequiredAppsMock.calledOnce, true, 'checkRequiredApps should be called once');
      assert.strictEqual(showQuickPickMock.calledOnce, true, 'showQuickPick should be called once');
      assert.strictEqual(gitInitMock.notCalled, true, 'gitInit should not be called');
      assert.strictEqual(getTruffleBoxNameMock.calledOnce, true, 'getTruffleBoxName should be called once');
      assert.strictEqual(showOpenFolderDialogMock.calledOnce, true, 'showOpenFolderDialog should be called once');
      assert.strictEqual(ensureDirMock.calledOnce, true, 'ensureDir should be called once');
      assert.strictEqual(
        ensureDirMock.args[0][0],
        firstProjectPath,
        'ensureDir should be called with correct arguments');
      assert.strictEqual(readdirMock.calledOnce, true, 'readdir should be called once');
      assert.strictEqual(readdirMock.args[0][0], firstProjectPath, 'readdir should be called with correct arguments');
      assert.strictEqual(showErrorMessageMock.notCalled, true, 'showErrorMessage should not be called');
      assert.strictEqual(executeCommandMock.calledOnce, true, 'executeCommand should be called once');
      assert.strictEqual(
        executeCommandMock.args[0][0],
        firstProjectPath,
        'executeCommand should be called with correct arguments');
      assert.strictEqual(
        executeCommandMock.args[0][1],
        'npx',
        'executeCommand should be called with correct arguments');
      assert.strictEqual(
        executeCommandMock.args[0][2],
        RequiredApps.truffle,
        'executeCommand should be called with correct arguments');
      assert.strictEqual(
        executeCommandMock.args[0][3],
        'unbox',
        'executeCommand should be called with correct arguments');
      assert.strictEqual(
        executeCommandMock.args[0][4],
        truffleBoxName,
        'executeCommand should be called with correct arguments');
      assert.strictEqual(updateWorkspaceFoldersMock.notCalled, true, 'updateWorkspaceFolders should not be called');
      assert.strictEqual(emptyDirSyncMock.calledOnce, true, 'emptyDirSync should be called once');
      assert.strictEqual(
        emptyDirSyncMock.args[0][0],
        firstProjectPath,
        'emptyDirSync should be called with correct arguments');
    });
  });
});
