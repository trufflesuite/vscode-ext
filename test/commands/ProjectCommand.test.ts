// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as assert from 'assert';
import * as fs from 'fs-extra';
import rewire = require('rewire');
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { Constants } from '../../src/Constants';
import * as helpers from '../../src/helpers';
import { CancellationEvent } from '../../src/Models';
import { Output } from '../../src/Output';

describe('ProjectСommands', () => {
  describe('Unit tests', () => {
    let helpersMock: sinon.SinonMock;
    const projectPath = 'projectPath';
    const truffleBoxName = 'truffleBoxName';

    before(() => {
      helpersMock = sinon.mock(helpers);
    });

    after(() => {
      helpersMock.restore();
    });

    describe('newSolidityProject', () => {
      let gitHelperMock: sinon.SinonMock;
      let showQuickPickMock: sinon.SinonStub<any[], any>;
      let gitInitMock: sinon.SinonStub<any[], any>;
      let requiredMock: sinon.SinonMock;
      let checkRequiredAppsMock: sinon.SinonExpectation;

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
      });

      afterEach(() => {
        requiredMock.restore();
        gitHelperMock.restore();
        helpersMock.restore();
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
        assert.strictEqual(checkRequiredAppsMock.calledOnce, true);
        assert.strictEqual(showQuickPickMock.notCalled, true);
        assert.strictEqual(chooseNewProjectDirMock.notCalled, true);
        assert.strictEqual(gitInitMock.notCalled, true);
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
        assert.strictEqual(checkRequiredAppsMock.calledOnce, true);
        assert.strictEqual(showQuickPickMock.calledOnce, true);
        assert.strictEqual(chooseNewProjectDirMock.calledOnce, true);
        assert.strictEqual(gitInitMock.calledOnce, true);
        assert.strictEqual(gitInitMock.args[0][0], projectPath);
      });
    });

    describe('chooseNewProjectDir', () => {
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

        windowMock = sinon.mock(vscode.window);
        showErrorMessageMock = windowMock.expects('showErrorMessage');
      });

      afterEach(() => {
        fsMock.restore();
        windowMock.restore();
        helpersMock.restore();
      });

      it('Method chooseNewProjectDir returns projectPath which we selected', async () => {
        // Arrange
        readdirMock.returns([]);
        const projectCommandsRewire = rewire('../../src/commands/ProjectCommands');
        const chooseNewProjectDir = projectCommandsRewire.__get__('chooseNewProjectDir');

        // Act
        const newProjectPath = await chooseNewProjectDir();

        // Assert
        assert.strictEqual(showOpenFolderDialogMock.calledOnce, true);
        assert.strictEqual(ensureDirMock.calledOnce, true);
        assert.strictEqual(ensureDirMock.args[0][0], firstProjectPath);
        assert.strictEqual(readdirMock.calledOnce, true);
        assert.strictEqual(readdirMock.args[0][0], firstProjectPath);
        assert.strictEqual(newProjectPath, firstProjectPath);
        assert.strictEqual(showErrorMessageMock.notCalled, true);
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
        assert.strictEqual(showOpenFolderDialogMock.calledTwice, true);
        assert.strictEqual(ensureDirMock.calledTwice, true);
        assert.strictEqual(ensureDirMock.firstCall.args[0], firstProjectPath);
        assert.strictEqual(ensureDirMock.secondCall.args[0], secondProjectPath);
        assert.strictEqual(readdirMock.calledTwice, true);
        assert.strictEqual(readdirMock.firstCall.args[0], firstProjectPath);
        assert.strictEqual(readdirMock.secondCall.args[0], secondProjectPath);
        assert.strictEqual(newProjectPath, secondProjectPath);
        assert.strictEqual(showErrorMessageMock.calledOnce, true);
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
        assert.strictEqual(showOpenFolderDialogMock.calledOnce, true);
        assert.strictEqual(ensureDirMock.calledOnce, true);
        assert.strictEqual(ensureDirMock.args[0][0], firstProjectPath);
        assert.strictEqual(readdirMock.calledOnce, true);
        assert.strictEqual(readdirMock.args[0][0], firstProjectPath);
        assert.strictEqual(showErrorMessageMock.calledOnce, true);
      });
    });

    describe('createNewEmptyProject', () => {
      let withProgressMock: sinon.SinonStub<any[], any>;
      let windowMock: sinon.SinonMock;

      beforeEach(() => {
        windowMock = sinon.mock(vscode.window);
        withProgressMock = windowMock.expects('withProgress');
      });

      afterEach(() => {
        windowMock.restore();
      });

      it('Method createNewEmptyProject runs method createProject.', async () => {
        // Arrange
        const projectCommandsRewire = rewire('../../src/commands/ProjectCommands');
        const createNewEmptyProject = projectCommandsRewire.__get__('createNewEmptyProject');

        // Act
        await createNewEmptyProject(projectPath);

        // Assert
        assert.strictEqual(withProgressMock.calledOnce, true);
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
      assert.strictEqual(getTruffleBoxNameMock.calledOnce, true);
      assert.strictEqual(createProjectMock.calledOnce, true);
      assert.strictEqual(createProjectMock.args[0][0], projectPath);
      assert.strictEqual(createProjectMock.args[0][1], truffleBoxName);
    });

    describe('createProject', () => {
      let outputMock: sinon.SinonMock;
      let showMock: sinon.SinonExpectation;
      let outputCommandHelperMock: sinon.SinonMock;
      let executeCommandMock: sinon.SinonExpectation;
      let workspaceMock: sinon.SinonMock;
      let updateWorkspaceFoldersMock: sinon.SinonExpectation;
      let fsMock: sinon.SinonMock;
      let emptyDirSyncMock: sinon.SinonExpectation;

      beforeEach(() => {
        outputMock = sinon.mock(Output);
        showMock = outputMock.expects('show');
        outputCommandHelperMock = sinon.mock(helpers.outputCommandHelper);
        executeCommandMock = outputCommandHelperMock.expects('executeCommand');
        workspaceMock = sinon.mock(vscode.workspace);
        updateWorkspaceFoldersMock = workspaceMock.expects('updateWorkspaceFolders');
        fsMock = sinon.mock(fs);
        emptyDirSyncMock = fsMock.expects('emptyDirSync');
      });

      afterEach(() => {
        outputMock.restore();
        outputCommandHelperMock.restore();
        workspaceMock.restore();
        fsMock.restore();
      });

      it('Method createProject run command for create new project and project was created successfully. ' +
      'Workspace was updated to certain workspace.', async () => {
        // Arrange
        sinon.stub(vscode.workspace, 'workspaceFolders').value(['1']);
        const projectCommandsRewire = rewire('../../src/commands/ProjectCommands');
        const createProject = projectCommandsRewire.__get__('createProject');

        // Act
        await createProject(projectPath, truffleBoxName);

        // Assert
        assert.strictEqual(showMock.calledOnce, true);
        assert.strictEqual(executeCommandMock.calledOnce, true);
        assert.strictEqual(executeCommandMock.args[0][0], projectPath);
        assert.strictEqual(executeCommandMock.args[0][1], 'npx');
        assert.strictEqual(executeCommandMock.args[0][2], Constants.truffleCommand);
        assert.strictEqual(executeCommandMock.args[0][3], 'unbox');
        assert.strictEqual(executeCommandMock.args[0][4], truffleBoxName);
        assert.strictEqual(updateWorkspaceFoldersMock.calledOnce, true);
        assert.strictEqual(updateWorkspaceFoldersMock.args[0][0], 0);
        assert.strictEqual(updateWorkspaceFoldersMock.args[0][1], 1);
        assert.strictEqual(updateWorkspaceFoldersMock.args[0][2].uri.path, `/${projectPath}`);
        assert.strictEqual(emptyDirSyncMock.notCalled, true);
      });

      it('Method createProject run command for create new project and project was created successfully. ' +
      'Workspace was not updated to certain workspace.', async () => {
        // Arrange
        sinon.stub(vscode.workspace, 'workspaceFolders').value(undefined);
        const projectCommandsRewire = rewire('../../src/commands/ProjectCommands');
        const createProject = projectCommandsRewire.__get__('createProject');

        // Act
        await createProject(projectPath, truffleBoxName);

        // Assert
        assert.strictEqual(showMock.calledOnce, true);
        assert.strictEqual(executeCommandMock.calledOnce, true);
        assert.strictEqual(executeCommandMock.args[0][0], projectPath);
        assert.strictEqual(executeCommandMock.args[0][1], 'npx');
        assert.strictEqual(executeCommandMock.args[0][2], Constants.truffleCommand);
        assert.strictEqual(executeCommandMock.args[0][3], 'unbox');
        assert.strictEqual(executeCommandMock.args[0][4], truffleBoxName);
        assert.strictEqual(updateWorkspaceFoldersMock.calledOnce, true);
        assert.strictEqual(updateWorkspaceFoldersMock.args[0][0], 0);
        assert.strictEqual(updateWorkspaceFoldersMock.args[0][1], null);
        assert.strictEqual(updateWorkspaceFoldersMock.args[0][2].uri.path, `/${projectPath}`);
        assert.strictEqual(emptyDirSyncMock.notCalled, true);
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
        assert.strictEqual(showMock.calledOnce, true);
        assert.strictEqual(executeCommandMock.calledOnce, true);
        assert.strictEqual(executeCommandMock.args[0][0], projectPath);
        assert.strictEqual(executeCommandMock.args[0][1], 'npx');
        assert.strictEqual(executeCommandMock.args[0][2], Constants.truffleCommand);
        assert.strictEqual(executeCommandMock.args[0][3], 'unbox');
        assert.strictEqual(executeCommandMock.args[0][4], truffleBoxName);
        assert.strictEqual(updateWorkspaceFoldersMock.notCalled, true);
        assert.strictEqual(emptyDirSyncMock.calledOnce, true);
        assert.strictEqual(emptyDirSyncMock.args[0][0], projectPath);
      });
    });

    it('Method getTruffleBoxName should return a value', async () => {
      // Arrange
      const testName = 'test';
      const projectCommandsRewire = rewire('../../src/commands/ProjectCommands');
      const getTruffleBoxName = projectCommandsRewire.__get__('getTruffleBoxName');
      const showInputBoxMock = helpersMock.expects('showInputBox');

      showInputBoxMock.returns(testName);

      // Act
      const result = await getTruffleBoxName();

      // Assert
      assert.strictEqual(result, testName);
      assert.strictEqual(showInputBoxMock.calledOnce, true);
    });
  });

  describe('Integration tests', () => {
    let helpersMock: sinon.SinonMock;
    const truffleBoxName = 'truffleBoxName';
    const firstProjectPath = 'firstProjectPath';
    const secondProjectPath = 'secondProjectPath';

    before(() => {
      helpersMock = sinon.mock(helpers);
    });

    after(() => {
      helpersMock.restore();
    });

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
    let showMock: sinon.SinonExpectation;
    let workspaceMock: sinon.SinonMock;
    let updateWorkspaceFoldersMock: sinon.SinonExpectation;
    let emptyDirSyncMock: sinon.SinonExpectation;

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

      windowMock = sinon.mock(vscode.window);
      showErrorMessageMock = windowMock.expects('showErrorMessage');
      workspaceMock = sinon.mock(vscode.workspace);
      updateWorkspaceFoldersMock = workspaceMock.expects('updateWorkspaceFolders');

      outputMock = sinon.mock(Output);
      showMock = outputMock.expects('show');
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
      assert.strictEqual(checkRequiredAppsMock.calledOnce, true);
      assert.strictEqual(showQuickPickMock.calledOnce, true);
      assert.strictEqual(gitInitMock.calledOnce, true);
      assert.strictEqual(gitInitMock.args[0][0], secondProjectPath);
      assert.strictEqual(showOpenFolderDialogMock.calledTwice, true);
      assert.strictEqual(ensureDirMock.calledTwice, true);
      assert.strictEqual(ensureDirMock.firstCall.args[0], firstProjectPath);
      assert.strictEqual(ensureDirMock.secondCall.args[0], secondProjectPath);
      assert.strictEqual(readdirMock.calledTwice, true);
      assert.strictEqual(readdirMock.firstCall.args[0], firstProjectPath);
      assert.strictEqual(readdirMock.secondCall.args[0], secondProjectPath);
      assert.strictEqual(showErrorMessageMock.calledOnce, true);
    });

    it('Method chooseNewProjectDir returns projectPath which we selected at first time.', async () => {
      // Arrange
      checkRequiredAppsMock.returns(true);
      sinon.stub(vscode.workspace, 'workspaceFolders').value(['1']);
      readdirMock.returns([]);
      showQuickPickMock.returns({
        cmd: () => undefined,
        label: 'emptyProject',
      });
      const projectCommandsRewire = rewire('../../src/commands/ProjectCommands');

      // Act
      await projectCommandsRewire.ProjectCommands.newSolidityProject();

      // Assert
      assert.strictEqual(checkRequiredAppsMock.calledOnce, true);
      assert.strictEqual(showQuickPickMock.calledOnce, true);
      assert.strictEqual(gitInitMock.calledOnce, true);
      assert.strictEqual(gitInitMock.args[0][0], firstProjectPath);
      assert.strictEqual(showOpenFolderDialogMock.calledOnce, true);
      assert.strictEqual(ensureDirMock.calledOnce, true);
      assert.strictEqual(ensureDirMock.args[0][0], firstProjectPath);
      assert.strictEqual(readdirMock.calledOnce, true);
      assert.strictEqual(readdirMock.args[0][0], firstProjectPath);
      assert.strictEqual(showErrorMessageMock.notCalled, true);
    });

    it('Method createNewEmptyProject runs method createProject, and new empty project was created successfully.',
    async () => {
      // Arrange
      checkRequiredAppsMock.returns(true);
      readdirMock.returns([]);
      sinon.stub(vscode.workspace, 'workspaceFolders').value(['1']);

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
      assert.strictEqual(checkRequiredAppsMock.calledOnce, true);
      assert.strictEqual(showQuickPickMock.calledOnce, true);
      assert.strictEqual(gitInitMock.calledOnce, true);
      assert.strictEqual(gitInitMock.args[0][0], firstProjectPath);
      assert.strictEqual(showOpenFolderDialogMock.calledOnce, true);
      assert.strictEqual(ensureDirMock.calledOnce, true);
      assert.strictEqual(ensureDirMock.args[0][0], firstProjectPath);
      assert.strictEqual(readdirMock.calledOnce, true);
      assert.strictEqual(readdirMock.args[0][0], firstProjectPath);
      assert.strictEqual(showErrorMessageMock.notCalled, true);
      assert.strictEqual(showMock.calledOnce, true);
      assert.strictEqual(executeCommandMock.calledOnce, true);
      assert.strictEqual(executeCommandMock.args[0][0], firstProjectPath);
      assert.strictEqual(executeCommandMock.args[0][1], 'npx');
      assert.strictEqual(executeCommandMock.args[0][2], Constants.truffleCommand);
      assert.strictEqual(executeCommandMock.args[0][3], 'unbox');
      assert.strictEqual(executeCommandMock.args[0][4], Constants.defaultTruffleBox);
      assert.strictEqual(updateWorkspaceFoldersMock.calledOnce, true);
      assert.strictEqual(updateWorkspaceFoldersMock.args[0][0], 0);
      assert.strictEqual(updateWorkspaceFoldersMock.args[0][1], 1);
      assert.strictEqual(updateWorkspaceFoldersMock.args[0][2].uri.path, `/${firstProjectPath}`);
      assert.strictEqual(emptyDirSyncMock.notCalled, true);
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
      assert.strictEqual(checkRequiredAppsMock.calledOnce, true);
      assert.strictEqual(showQuickPickMock.calledOnce, true);
      assert.strictEqual(gitInitMock.notCalled, true);
      assert.strictEqual(showOpenFolderDialogMock.calledOnce, true);
      assert.strictEqual(ensureDirMock.calledOnce, true);
      assert.strictEqual(ensureDirMock.args[0][0], firstProjectPath);
      assert.strictEqual(readdirMock.calledOnce, true);
      assert.strictEqual(readdirMock.args[0][0], firstProjectPath);
      assert.strictEqual(showErrorMessageMock.notCalled, true);
      assert.strictEqual(showMock.calledOnce, true);
      assert.strictEqual(executeCommandMock.calledOnce, true);
      assert.strictEqual(executeCommandMock.args[0][0], firstProjectPath);
      assert.strictEqual(executeCommandMock.args[0][1], 'npx');
      assert.strictEqual(executeCommandMock.args[0][2], Constants.truffleCommand);
      assert.strictEqual(executeCommandMock.args[0][3], 'unbox');
      assert.strictEqual(executeCommandMock.args[0][4], Constants.defaultTruffleBox);
      assert.strictEqual(updateWorkspaceFoldersMock.notCalled, true);
      assert.strictEqual(emptyDirSyncMock.calledOnce, true);
      assert.strictEqual(emptyDirSyncMock.args[0][0], firstProjectPath);
    });

    it('Method createProjectFromTruffleBox get truffleBoxName and create new project with this name.',
    async () => {
      // Arrange
      checkRequiredAppsMock.returns(true);
      readdirMock.returns([]);
      sinon.stub(vscode.workspace, 'workspaceFolders').value(['1']);

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
      assert.strictEqual(checkRequiredAppsMock.calledOnce, true);
      assert.strictEqual(showQuickPickMock.calledOnce, true);
      assert.strictEqual(gitInitMock.calledOnce, true);
      assert.strictEqual(getTruffleBoxNameMock.calledOnce, true);
      assert.strictEqual(gitInitMock.args[0][0], firstProjectPath);
      assert.strictEqual(showOpenFolderDialogMock.calledOnce, true);
      assert.strictEqual(ensureDirMock.calledOnce, true);
      assert.strictEqual(ensureDirMock.args[0][0], firstProjectPath);
      assert.strictEqual(readdirMock.calledOnce, true);
      assert.strictEqual(readdirMock.args[0][0], firstProjectPath);
      assert.strictEqual(showErrorMessageMock.notCalled, true);
      assert.strictEqual(showMock.calledOnce, true);
      assert.strictEqual(executeCommandMock.calledOnce, true);
      assert.strictEqual(executeCommandMock.args[0][0], firstProjectPath);
      assert.strictEqual(executeCommandMock.args[0][1], 'npx');
      assert.strictEqual(executeCommandMock.args[0][2], Constants.truffleCommand);
      assert.strictEqual(executeCommandMock.args[0][3], 'unbox');
      assert.strictEqual(executeCommandMock.args[0][4], truffleBoxName);
      assert.strictEqual(updateWorkspaceFoldersMock.calledOnce, true);
      assert.strictEqual(updateWorkspaceFoldersMock.args[0][0], 0);
      assert.strictEqual(updateWorkspaceFoldersMock.args[0][1], 1);
      assert.strictEqual(updateWorkspaceFoldersMock.args[0][2].uri.path, `/${firstProjectPath}`);
      assert.strictEqual(emptyDirSyncMock.notCalled, true);
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
      assert.strictEqual(checkRequiredAppsMock.calledOnce, true);
      assert.strictEqual(showQuickPickMock.calledOnce, true);
      assert.strictEqual(gitInitMock.notCalled, true);
      assert.strictEqual(getTruffleBoxNameMock.calledOnce, true);
      assert.strictEqual(showOpenFolderDialogMock.calledOnce, true);
      assert.strictEqual(ensureDirMock.calledOnce, true);
      assert.strictEqual(ensureDirMock.args[0][0], firstProjectPath);
      assert.strictEqual(readdirMock.calledOnce, true);
      assert.strictEqual(readdirMock.args[0][0], firstProjectPath);
      assert.strictEqual(showErrorMessageMock.notCalled, true);
      assert.strictEqual(showMock.calledOnce, true);
      assert.strictEqual(executeCommandMock.calledOnce, true);
      assert.strictEqual(executeCommandMock.args[0][0], firstProjectPath);
      assert.strictEqual(executeCommandMock.args[0][1], 'npx');
      assert.strictEqual(executeCommandMock.args[0][2], Constants.truffleCommand);
      assert.strictEqual(executeCommandMock.args[0][3], 'unbox');
      assert.strictEqual(executeCommandMock.args[0][4], truffleBoxName);
      assert.strictEqual(updateWorkspaceFoldersMock.notCalled, true);
      assert.strictEqual(emptyDirSyncMock.calledOnce, true);
      assert.strictEqual(emptyDirSyncMock.args[0][0], firstProjectPath);
    });
  });
});
