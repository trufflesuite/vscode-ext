// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import * as assert from 'assert';
import fs from 'fs-extra';
import rewire from 'rewire';
import sinon from 'sinon';
import {CancellationToken, Progress, ProgressOptions, window, workspace} from 'vscode';
import {Constants, RequiredApps} from '../../src/Constants';
import * as helpers from '../../src/helpers/';
import {required} from '../../src/helpers/required';
import * as userInteraction from '../../src/helpers/userInteraction';
import {CancellationEvent} from '../../src/Models';
import {Output} from '../../src/Output';
import * as vscode from 'vscode';

enum ProjectType {
  empty = 'empty',
  sample = 'sample',
  box = 'box',
}

describe('ProjectCommands', () => {
  describe('Unit tests', () => {
    const truffleBoxName = 'truffleBoxName';

    describe('newSolidityProject', () => {
      let helpersMock: sinon.SinonMock;
      let userInteractionMock: sinon.SinonMock;
      let showQuickPickMock: sinon.SinonStub<any[], any>;
      let requiredMock: sinon.SinonMock;
      let checkRequiredAppsMock: sinon.SinonExpectation;
      let withProgressStub: sinon.SinonStub<
        [ProgressOptions, (progress: Progress<any>, token: CancellationToken) => any],
        any
      >;

      beforeEach(() => {
        helpersMock = sinon.mock(helpers);
        userInteractionMock = sinon.mock(userInteraction);
        showQuickPickMock = userInteractionMock.expects('showQuickPick').returns({
          cmd: () => undefined,
          label: 'emptyProject',
        });
        requiredMock = sinon.mock(required);
        checkRequiredAppsMock = requiredMock.expects('checkRequiredApps');

        withProgressStub = sinon.stub(window, 'withProgress');
        withProgressStub.callsFake(async (...args: any[]) => {
          return args[1]();
        });
      });

      afterEach(() => {
        requiredMock.restore();
        helpersMock.restore();
        userInteractionMock.restore();
        withProgressStub.restore();
      });

      it('Method newSolidityProject does not provide type of new project, because we have not required apps.', async () => {
        // Arrange
        checkRequiredAppsMock.returns(false);
        const projectCommandsRewire = rewire('../../src/commands/ProjectCommands');

        // Act
        await projectCommandsRewire.ProjectCommands.newSolidityProject();

        // Assert
        assert.strictEqual(checkRequiredAppsMock.calledOnce, true, 'checkRequiredApps should be called once');
        assert.strictEqual(showQuickPickMock.notCalled, true, 'showQuickPick should not be called');
      });

      it('Method newSolidityProject provide type of new project, because we have all required apps.', async () => {
        // Arrange
        checkRequiredAppsMock.returns(true);
        const projectCommandsRewire = rewire('../../src/commands/ProjectCommands');

        // Act
        await projectCommandsRewire.ProjectCommands.newSolidityProject();

        // Assert
        assert.strictEqual(checkRequiredAppsMock.calledOnce, true, 'checkRequiredApps should be called once');
        assert.strictEqual(showQuickPickMock.calledOnce, true, 'showQuickPick should be called once');
      });
    });

    describe('chooseNewProjectDir', () => {
      let requiredMock: sinon.SinonMock;
      const firstProjectPath = 'firstProjectPath';
      const secondProjectPath = 'secondProjectPath';
      let fsMock: sinon.SinonMock;
      let windowMock: sinon.SinonMock;
      let showOpenFolderDialogMock: sinon.SinonExpectation;
      let ensureDirMock: sinon.SinonExpectation;
      let readdirMock: sinon.SinonExpectation;
      let showErrorMessageMock: sinon.SinonStub<any[], any>;

      beforeEach(() => {
        requiredMock = sinon.mock(userInteraction);
        showOpenFolderDialogMock = requiredMock.expects('showOpenFolderDialog');
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
          'ensureDir should be called with correct arguments'
        );
        assert.strictEqual(readdirMock.calledOnce, true, 'readdir should be called once');
        assert.strictEqual(readdirMock.args[0][0], firstProjectPath, 'readdir should be called with correct arguments');
        assert.strictEqual(newProjectPath, firstProjectPath, 'newProjectPath should be equal to firstProjectPath');
        assert.strictEqual(showErrorMessageMock.notCalled, true, 'showErrorMessage should not be called');
      });

      it(
        'Method chooseNewProjectDir returns projectPath at second time, because we selected not empty dir ' +
          'at first time.',
        async () => {
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
            'ensureDir should be called with correct arguments'
          );
          assert.strictEqual(
            ensureDirMock.secondCall.args[0],
            secondProjectPath,
            'ensureDir should be called with correct arguments'
          );
          assert.strictEqual(readdirMock.calledTwice, true, 'readdir should be called once');
          assert.strictEqual(
            readdirMock.firstCall.args[0],
            firstProjectPath,
            'readdir should be called with correct arguments'
          );
          assert.strictEqual(
            readdirMock.secondCall.args[0],
            secondProjectPath,
            'readdir should be called with correct arguments'
          );
          assert.strictEqual(newProjectPath, secondProjectPath, 'newProjectPath should be equal to secondProjectPath');
          assert.strictEqual(showErrorMessageMock.calledOnce, true, 'showErrorMessage should be called once');
        }
      );

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
          'ensureDir should be called with correct arguments'
        );
        assert.strictEqual(readdirMock.calledOnce, true, 'readdir should be called once');
        assert.strictEqual(readdirMock.args[0][0], firstProjectPath, 'readdir should be called with correct arguments');
        assert.strictEqual(showErrorMessageMock.calledOnce, true, 'showErrorMessage should be called once');
      });
    });

    describe('createProject', () => {
      let outputCommandHelperMock: sinon.SinonMock;
      let executeCommandMock: sinon.SinonExpectation;
      let workspaceMock: sinon.SinonMock;
      let updateWorkspaceFoldersMock: sinon.SinonExpectation;
      let fsMock: sinon.SinonMock;
      let emptyDirSyncMock: sinon.SinonExpectation;
      let gitHelperMock: sinon.SinonMock;
      let gitInitMock: sinon.SinonStub<any[], any>;

      beforeEach(() => {
        outputCommandHelperMock = sinon.mock(helpers.outputCommandHelper);
        executeCommandMock = outputCommandHelperMock.expects('executeCommand');
        workspaceMock = sinon.mock(workspace);
        updateWorkspaceFoldersMock = workspaceMock.expects('updateWorkspaceFolders');
        fsMock = sinon.mock(fs);
        emptyDirSyncMock = fsMock.expects('emptyDirSync');
        gitHelperMock = sinon.mock(helpers.gitHelper);
        gitInitMock = gitHelperMock.expects('gitInit').returns(() => undefined);
      });

      afterEach(() => {
        sinon.restore();
      });

      it(
        'Method createProject run command for create a empty project and project was created successfully. ' +
          'Workspace was updated to certain workspace.',
        async () => {
          // Arrange
          sinon.stub(workspace, 'workspaceFolders').value(['1']);
          const projectCommandsRewire = rewire('../../src/commands/ProjectCommands');
          const createProject = projectCommandsRewire.__get__('createProject');
          projectCommandsRewire.__set__('chooseNewProjectDir', sinon.mock().returns(''));
          const chooseNewProjectDirMock = projectCommandsRewire.__get__('chooseNewProjectDir');

          // Act
          await createProject(ProjectType.empty);

          // Assert
          assert.strictEqual(executeCommandMock.calledOnce, true, 'executeCommand should be called once');
          assert.strictEqual(
            executeCommandMock.args[0][1],
            'npx',
            'executeCommand should be called with correct arguments'
          );
          assert.strictEqual(
            executeCommandMock.args[0][2],
            RequiredApps.truffle,
            'executeCommand should be called with correct arguments'
          );
          assert.strictEqual(
            executeCommandMock.args[0][3],
            'init',
            'executeCommand should be called with correct arguments'
          );
          assert.strictEqual(
            updateWorkspaceFoldersMock.calledOnce,
            true,
            'updateWorkspaceFolders should be called once'
          );
          assert.strictEqual(
            updateWorkspaceFoldersMock.args[0][0],
            0,
            'updateWorkspaceFolders should be called with correct arguments'
          );
          assert.strictEqual(
            updateWorkspaceFoldersMock.args[0][1],
            1,
            'updateWorkspaceFolders should be called with correct arguments'
          );
          assert.strictEqual(emptyDirSyncMock.notCalled, true, 'emptyDirSync should not be called');
          assert.strictEqual(chooseNewProjectDirMock.calledOnce, true, 'chooseNewProjectDir should be called once');
          assert.strictEqual(gitInitMock.calledOnce, true, 'gitInit should be called once');
        }
      );

      it(
        'Method createProject run command for unbox a sample project and project was created successfully. ' +
          'Workspace was updated to certain workspace.',
        async () => {
          // Arrange
          sinon.stub(workspace, 'workspaceFolders').value(['1']);
          const projectCommandsRewire = rewire('../../src/commands/ProjectCommands');
          const createProject = projectCommandsRewire.__get__('createProject');
          projectCommandsRewire.__set__('chooseNewProjectDir', sinon.mock().returns(''));
          const chooseNewProjectDirMock = projectCommandsRewire.__get__('chooseNewProjectDir');

          // Act
          await createProject(ProjectType.sample);

          // Assert
          assert.strictEqual(executeCommandMock.calledOnce, true, 'executeCommand should be called once');
          assert.strictEqual(
            executeCommandMock.args[0][1],
            'npx',
            'executeCommand should be called with correct arguments'
          );
          assert.strictEqual(
            executeCommandMock.args[0][2],
            RequiredApps.truffle,
            'executeCommand should be called with correct arguments'
          );
          assert.strictEqual(
            executeCommandMock.args[0][3],
            'unbox',
            'executeCommand should be called with correct arguments'
          );
          assert.strictEqual(
            executeCommandMock.args[0][4],
            Constants.sampleTruffleBox,
            'executeCommand should be called with correct arguments'
          );
          assert.strictEqual(
            updateWorkspaceFoldersMock.calledOnce,
            true,
            'updateWorkspaceFolders should be called once'
          );
          assert.strictEqual(
            updateWorkspaceFoldersMock.args[0][0],
            0,
            'updateWorkspaceFolders should be called with correct arguments'
          );
          assert.strictEqual(
            updateWorkspaceFoldersMock.args[0][1],
            1,
            'updateWorkspaceFolders should be called with correct arguments'
          );
          assert.strictEqual(emptyDirSyncMock.notCalled, true, 'emptyDirSync should not be called');
          assert.strictEqual(chooseNewProjectDirMock.calledOnce, true, 'chooseNewProjectDir should be called once');
          assert.strictEqual(gitInitMock.calledOnce, true, 'gitInit should be called once');
        }
      );

      it(
        'Method createProject run command for unbox a truffle box project and project was created successfully. ' +
          'Workspace was updated to certain workspace.',
        async () => {
          // Arrange
          sinon.stub(workspace, 'workspaceFolders').value(['1']);
          const projectCommandsRewire = rewire('../../src/commands/ProjectCommands');
          const createProject = projectCommandsRewire.__get__('createProject');
          projectCommandsRewire.__set__('getTruffleUnboxCommand', sinon.mock().returns(truffleBoxName));
          const getTruffleUnboxCommandMock = projectCommandsRewire.__get__('getTruffleUnboxCommand');
          projectCommandsRewire.__set__('chooseNewProjectDir', sinon.mock().returns(''));
          const chooseNewProjectDirMock = projectCommandsRewire.__get__('chooseNewProjectDir');

          // Act
          await createProject(ProjectType.box);

          // Assert
          assert.strictEqual(executeCommandMock.calledOnce, true, 'executeCommand should be called once');
          assert.strictEqual(
            executeCommandMock.args[0][1],
            'npx',
            'executeCommand should be called with correct arguments'
          );
          assert.strictEqual(
            executeCommandMock.args[0][2],
            RequiredApps.truffle,
            'executeCommand should be called with correct arguments'
          );
          assert.strictEqual(
            executeCommandMock.args[0][3],
            'unbox',
            'executeCommand should be called with correct arguments'
          );
          assert.strictEqual(
            executeCommandMock.args[0][4],
            truffleBoxName,
            'executeCommand should be called with correct arguments'
          );
          assert.strictEqual(
            updateWorkspaceFoldersMock.calledOnce,
            true,
            'updateWorkspaceFolders should be called once'
          );
          assert.strictEqual(
            updateWorkspaceFoldersMock.args[0][0],
            0,
            'updateWorkspaceFolders should be called with correct arguments'
          );
          assert.strictEqual(
            updateWorkspaceFoldersMock.args[0][1],
            1,
            'updateWorkspaceFolders should be called with correct arguments'
          );
          assert.strictEqual(emptyDirSyncMock.notCalled, true, 'emptyDirSync should not be called');
          assert.strictEqual(
            getTruffleUnboxCommandMock.calledOnce,
            true,
            'getTruffleUnboxCommand should be called once'
          );
          assert.strictEqual(chooseNewProjectDirMock.calledOnce, true, 'chooseNewProjectDir should be called once');
          assert.strictEqual(gitInitMock.calledOnce, true, 'gitInit should be called once');
        }
      );

      it(
        'Method createProject run command for create a empty project and project was created successfully. ' +
          'Workspace was not updated to certain workspace.',
        async () => {
          // Arrange
          sinon.stub(workspace, 'workspaceFolders').value(undefined);
          const projectCommandsRewire = rewire('../../src/commands/ProjectCommands');
          const createProject = projectCommandsRewire.__get__('createProject');
          projectCommandsRewire.__set__('chooseNewProjectDir', sinon.mock().returns(''));
          const chooseNewProjectDirMock = projectCommandsRewire.__get__('chooseNewProjectDir');

          // Act
          await createProject(ProjectType.empty);

          // Assert
          assert.strictEqual(executeCommandMock.calledOnce, true, 'executeCommand should be called once');
          assert.strictEqual(
            executeCommandMock.args[0][1],
            'npx',
            'executeCommand should be called with correct arguments'
          );
          assert.strictEqual(
            executeCommandMock.args[0][2],
            RequiredApps.truffle,
            'executeCommand should be called with correct arguments'
          );
          assert.strictEqual(
            executeCommandMock.args[0][3],
            'init',
            'executeCommand should be called with correct arguments'
          );
          assert.strictEqual(
            updateWorkspaceFoldersMock.calledOnce,
            true,
            'updateWorkspaceFolders should be called once'
          );
          assert.strictEqual(
            updateWorkspaceFoldersMock.args[0][0],
            0,
            'updateWorkspaceFolders should be called with correct arguments'
          );
          assert.strictEqual(
            updateWorkspaceFoldersMock.args[0][1],
            null,
            'updateWorkspaceFolders should be called with correct arguments'
          );
          assert.strictEqual(emptyDirSyncMock.notCalled, true, 'emptyDirSync should not be called');
          assert.strictEqual(chooseNewProjectDirMock.calledOnce, true, 'chooseNewProjectDir should be called once');
          assert.strictEqual(gitInitMock.calledOnce, true, 'gitInit should be called once');
        }
      );

      it(
        'Method createProject run command for unbox a sample project and project was created successfully. ' +
          'Workspace was not updated to certain workspace.',
        async () => {
          // Arrange
          sinon.stub(workspace, 'workspaceFolders').value(undefined);
          const projectCommandsRewire = rewire('../../src/commands/ProjectCommands');
          const createProject = projectCommandsRewire.__get__('createProject');
          projectCommandsRewire.__set__('chooseNewProjectDir', sinon.mock().returns(''));
          const chooseNewProjectDirMock = projectCommandsRewire.__get__('chooseNewProjectDir');

          // Act
          await createProject(ProjectType.sample);

          // Assert
          assert.strictEqual(executeCommandMock.calledOnce, true, 'executeCommand should be called once');
          assert.strictEqual(
            executeCommandMock.args[0][1],
            'npx',
            'executeCommand should be called with correct arguments'
          );
          assert.strictEqual(
            executeCommandMock.args[0][2],
            RequiredApps.truffle,
            'executeCommand should be called with correct arguments'
          );
          assert.strictEqual(
            executeCommandMock.args[0][3],
            'unbox',
            'executeCommand should be called with correct arguments'
          );
          assert.strictEqual(
            executeCommandMock.args[0][4],
            Constants.sampleTruffleBox,
            'executeCommand should be called with correct arguments'
          );
          assert.strictEqual(
            updateWorkspaceFoldersMock.calledOnce,
            true,
            'updateWorkspaceFolders should be called once'
          );
          assert.strictEqual(
            updateWorkspaceFoldersMock.args[0][0],
            0,
            'updateWorkspaceFolders should be called with correct arguments'
          );
          assert.strictEqual(
            updateWorkspaceFoldersMock.args[0][1],
            null,
            'updateWorkspaceFolders should be called with correct arguments'
          );
          assert.strictEqual(emptyDirSyncMock.notCalled, true, 'emptyDirSync should not be called');
          assert.strictEqual(chooseNewProjectDirMock.calledOnce, true, 'chooseNewProjectDir should be called once');
          assert.strictEqual(gitInitMock.calledOnce, true, 'gitInit should be called once');
        }
      );

      it(
        'Method createProject run command for unbox a truffle box project and project was created successfully. ' +
          'Workspace was not updated to certain workspace.',
        async () => {
          // Arrange
          sinon.stub(workspace, 'workspaceFolders').value(undefined);
          const projectCommandsRewire = rewire('../../src/commands/ProjectCommands');
          const createProject = projectCommandsRewire.__get__('createProject');
          projectCommandsRewire.__set__('getTruffleUnboxCommand', sinon.mock().returns(truffleBoxName));
          const getTruffleUnboxCommandMock = projectCommandsRewire.__get__('getTruffleUnboxCommand');
          projectCommandsRewire.__set__('chooseNewProjectDir', sinon.mock().returns(''));
          const chooseNewProjectDirMock = projectCommandsRewire.__get__('chooseNewProjectDir');

          // Act
          await createProject(ProjectType.box);

          // Assert
          assert.strictEqual(executeCommandMock.calledOnce, true, 'executeCommand should be called once');
          assert.strictEqual(
            executeCommandMock.args[0][1],
            'npx',
            'executeCommand should be called with correct arguments'
          );
          assert.strictEqual(
            executeCommandMock.args[0][2],
            RequiredApps.truffle,
            'executeCommand should be called with correct arguments'
          );
          assert.strictEqual(
            executeCommandMock.args[0][3],
            'unbox',
            'executeCommand should be called with correct arguments'
          );
          assert.strictEqual(
            executeCommandMock.args[0][4],
            truffleBoxName,
            'executeCommand should be called with correct arguments'
          );
          assert.strictEqual(
            updateWorkspaceFoldersMock.calledOnce,
            true,
            'updateWorkspaceFolders should be called once'
          );
          assert.strictEqual(
            updateWorkspaceFoldersMock.args[0][0],
            0,
            'updateWorkspaceFolders should be called with correct arguments'
          );
          assert.strictEqual(
            updateWorkspaceFoldersMock.args[0][1],
            null,
            'updateWorkspaceFolders should be called with correct arguments'
          );
          assert.strictEqual(emptyDirSyncMock.notCalled, true, 'emptyDirSync should not be called');
          assert.strictEqual(
            getTruffleUnboxCommandMock.calledOnce,
            true,
            'getTruffleUnboxCommand should be called once'
          );
          assert.strictEqual(chooseNewProjectDirMock.calledOnce, true, 'chooseNewProjectDir should be called once');
          assert.strictEqual(gitInitMock.calledOnce, true, 'gitInit should be called once');
        }
      );

      it('Method createProject run command for create a empty project and creation was fell of project.', async () => {
        // Arrange
        executeCommandMock.throws();
        const projectCommandsRewire = rewire('../../src/commands/ProjectCommands');
        const createProject = projectCommandsRewire.__get__('createProject');
        projectCommandsRewire.__set__('chooseNewProjectDir', sinon.mock().returns(''));
        const chooseNewProjectDirMock = projectCommandsRewire.__get__('chooseNewProjectDir');

        // Act
        const action = async () => {
          await createProject(ProjectType.empty);
        };

        // Assert
        await assert.rejects(action, Error, Constants.errorMessageStrings.NewProjectCreationFailed);
        assert.strictEqual(executeCommandMock.calledOnce, true, 'executeCommand should be called once');
        assert.strictEqual(
          executeCommandMock.args[0][1],
          'npx',
          'executeCommand should be called with correct arguments'
        );
        assert.strictEqual(
          executeCommandMock.args[0][2],
          RequiredApps.truffle,
          'executeCommand should be called with correct arguments'
        );
        assert.strictEqual(
          executeCommandMock.args[0][3],
          'init',
          'executeCommand should be called with correct arguments'
        );
        assert.strictEqual(updateWorkspaceFoldersMock.notCalled, true, 'updateWorkspaceFolders should not be called');
        assert.strictEqual(emptyDirSyncMock.calledOnce, true, 'emptyDirSync should be called once');
        assert.strictEqual(chooseNewProjectDirMock.calledOnce, true, 'chooseNewProjectDir should be called once');
        assert.strictEqual(gitInitMock.calledOnce, false, 'gitInit should not be called once');
      });

      it('Method createProject run command for unbox a sample project and creation was fell of project.', async () => {
        // Arrange
        executeCommandMock.throws();
        const projectCommandsRewire = rewire('../../src/commands/ProjectCommands');
        const createProject = projectCommandsRewire.__get__('createProject');
        projectCommandsRewire.__set__('chooseNewProjectDir', sinon.mock().returns(''));
        const chooseNewProjectDirMock = projectCommandsRewire.__get__('chooseNewProjectDir');

        // Act
        const action = async () => {
          await createProject(ProjectType.sample);
        };

        // Assert
        await assert.rejects(action, Error, Constants.errorMessageStrings.NewProjectCreationFailed);
        assert.strictEqual(executeCommandMock.calledOnce, true, 'executeCommand should be called once');
        assert.strictEqual(
          executeCommandMock.args[0][1],
          'npx',
          'executeCommand should be called with correct arguments'
        );
        assert.strictEqual(
          executeCommandMock.args[0][2],
          RequiredApps.truffle,
          'executeCommand should be called with correct arguments'
        );
        assert.strictEqual(
          executeCommandMock.args[0][3],
          'unbox',
          'executeCommand should be called with correct arguments'
        );
        assert.strictEqual(
          executeCommandMock.args[0][4],
          Constants.sampleTruffleBox,
          'executeCommand should be called with correct arguments'
        );
        assert.strictEqual(updateWorkspaceFoldersMock.notCalled, true, 'updateWorkspaceFolders should not be called');
        assert.strictEqual(emptyDirSyncMock.calledOnce, true, 'emptyDirSync should be called once');
        assert.strictEqual(chooseNewProjectDirMock.calledOnce, true, 'chooseNewProjectDir should be called once');
        assert.strictEqual(gitInitMock.calledOnce, false, 'gitInit should not be called once');
      });

      it('Method createProject run command for unbox a truffle box project and creation was fell of project.', async () => {
        // Arrange
        executeCommandMock.throws();
        const projectCommandsRewire = rewire('../../src/commands/ProjectCommands');
        const createProject = projectCommandsRewire.__get__('createProject');
        projectCommandsRewire.__set__('getTruffleUnboxCommand', sinon.mock().returns(truffleBoxName));
        const getTruffleUnboxCommandMock = projectCommandsRewire.__get__('getTruffleUnboxCommand');
        projectCommandsRewire.__set__('chooseNewProjectDir', sinon.mock().returns(''));
        const chooseNewProjectDirMock = projectCommandsRewire.__get__('chooseNewProjectDir');

        // Act
        const action = async () => {
          await createProject(ProjectType.box);
        };

        // Assert
        await assert.rejects(action, Error, Constants.errorMessageStrings.NewProjectCreationFailed);
        assert.strictEqual(executeCommandMock.calledOnce, true, 'executeCommand should be called once');
        assert.strictEqual(
          executeCommandMock.args[0][1],
          'npx',
          'executeCommand should be called with correct arguments'
        );
        assert.strictEqual(
          executeCommandMock.args[0][2],
          RequiredApps.truffle,
          'executeCommand should be called with correct arguments'
        );
        assert.strictEqual(
          executeCommandMock.args[0][3],
          'unbox',
          'executeCommand should be called with correct arguments'
        );
        assert.strictEqual(
          executeCommandMock.args[0][4],
          truffleBoxName,
          'executeCommand should be called with correct arguments'
        );
        assert.strictEqual(updateWorkspaceFoldersMock.notCalled, true, 'updateWorkspaceFolders should not be called');
        assert.strictEqual(emptyDirSyncMock.calledOnce, true, 'emptyDirSync should be called once');
        assert.strictEqual(getTruffleUnboxCommandMock.calledOnce, true, 'getTruffleUnboxCommand should be called once');
        assert.strictEqual(chooseNewProjectDirMock.calledOnce, true, 'chooseNewProjectDir should be called once');
        assert.strictEqual(gitInitMock.calledOnce, false, 'gitInit should not be called once');
      });
    });

    it('Method getTruffleUnboxCommand should return a value', async () => {
      // Arrange
      const displayName = 'drizzle';
      const repoName = 'drizzle-box';
      const projectCommandsRewire = rewire('../../src/commands/ProjectCommands');
      const getTruffleUnboxCommand = projectCommandsRewire.__get__('getTruffleUnboxCommand');
      const showQuickPickMock = sinon.stub(vscode.window, 'showQuickPick');

      showQuickPickMock.onCall(0).callsFake((items: any) => {
        return items.find((item: any) => item.label === displayName);
      });

      // Act
      const result = await getTruffleUnboxCommand();

      // Assert
      assert.strictEqual(result, repoName, 'result should be equal to expected string');
      assert.strictEqual(showQuickPickMock.calledOnce, true, 'showQuickPick should be called once');
    });
  });

  describe('Integration tests', () => {
    let helpersMock: sinon.SinonMock;
    let userInteractionMock: sinon.SinonMock;
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
      [ProgressOptions, (progress: Progress<any>, token: CancellationToken) => any],
      any
    >;

    beforeEach(() => {
      helpersMock = sinon.mock(helpers);
      userInteractionMock = sinon.mock(userInteraction);
      showQuickPickMock = userInteractionMock.expects('showQuickPick');
      gitHelperMock = sinon.mock(helpers.gitHelper);
      gitInitMock = gitHelperMock.expects('gitInit').returns(() => undefined);
      requiredMock = sinon.mock(required);
      checkRequiredAppsMock = requiredMock.expects('checkRequiredApps');
      outputCommandHelperMock = sinon.mock(helpers.outputCommandHelper);
      executeCommandMock = outputCommandHelperMock.expects('executeCommand');

      showOpenFolderDialogMock = userInteractionMock.expects('showOpenFolderDialog');
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
      userInteractionMock.restore();
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
      const projectCommandsRewire = rewire('../../src/commands/ProjectCommands');
      const createProject = projectCommandsRewire.__get__('createProject');

      showQuickPickMock.returns({
        cmd: createProject,
        label: Constants.typeOfSolidityProject.text.emptyProject,
        detail: Constants.typeOfSolidityProject.description.emptyProject,
        projectType: ProjectType.empty,
      });

      showErrorMessageMock.returns(Constants.informationMessage.openButton);

      // Act
      await projectCommandsRewire.ProjectCommands.newSolidityProject();

      // Assert
      assert.strictEqual(checkRequiredAppsMock.calledOnce, true, 'checkRequiredApps should be called once');
      assert.strictEqual(showQuickPickMock.calledOnce, true, 'showQuickPick should be called once');
      assert.strictEqual(showOpenFolderDialogMock.calledTwice, true, 'showOpenFolderDialog should be called twice');
      assert.strictEqual(ensureDirMock.calledTwice, true, 'ensureDir should be called twice');
      assert.strictEqual(
        ensureDirMock.firstCall.args[0],
        firstProjectPath,
        'ensureDir should be called with correct arguments'
      );
      assert.strictEqual(
        ensureDirMock.secondCall.args[0],
        secondProjectPath,
        'ensureDir should be called with correct arguments'
      );
      assert.strictEqual(readdirMock.calledTwice, true, 'readdir should be called once');
      assert.strictEqual(
        readdirMock.firstCall.args[0],
        firstProjectPath,
        'readdir should be called with correct arguments'
      );
      assert.strictEqual(
        readdirMock.secondCall.args[0],
        secondProjectPath,
        'readdir should be called with correct arguments'
      );
      assert.strictEqual(showErrorMessageMock.calledOnce, true, 'showErrorMessage should be called once');
    });

    it('Method chooseNewProjectDir returns projectPath which we selected at first time.', async () => {
      // Arrange
      checkRequiredAppsMock.returns(true);
      sinon.stub(workspace, 'workspaceFolders').value(['1']);
      const projectCommandsRewire = rewire('../../src/commands/ProjectCommands');
      const createProject = projectCommandsRewire.__get__('createProject');

      readdirMock.returns([]);
      showQuickPickMock.returns({
        cmd: createProject,
        label: Constants.typeOfSolidityProject.text.emptyProject,
        detail: Constants.typeOfSolidityProject.description.emptyProject,
        projectType: ProjectType.empty,
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
        'ensureDir should be called with correct arguments'
      );
      assert.strictEqual(readdirMock.calledOnce, true, 'readdir should be called once');
      assert.strictEqual(readdirMock.args[0][0], firstProjectPath, 'readdir should be called with correct arguments');
      assert.strictEqual(showErrorMessageMock.notCalled, true, 'showErrorMessage should not be called');
    });

    it('Method newSolidityProject runs method createProject, and a new empty project was created successfully.', async () => {
      // Arrange
      checkRequiredAppsMock.returns(true);
      readdirMock.returns([]);
      sinon.stub(workspace, 'workspaceFolders').value(['1']);

      const projectCommandsRewire = rewire('../../src/commands/ProjectCommands');
      const createProject = projectCommandsRewire.__get__('createProject');

      showErrorMessageMock.returns(Constants.informationMessage.openButton);
      showQuickPickMock.returns({
        cmd: createProject,
        label: Constants.typeOfSolidityProject.text.emptyProject,
        detail: Constants.typeOfSolidityProject.description.emptyProject,
        projectType: ProjectType.empty,
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
        'ensureDir should be called with correct arguments'
      );
      assert.strictEqual(readdirMock.calledOnce, true, 'readdir should be called once');
      assert.strictEqual(readdirMock.args[0][0], firstProjectPath, 'readdir should be called with correct arguments');
      assert.strictEqual(showErrorMessageMock.notCalled, true, 'showErrorMessage should not be called');
      assert.strictEqual(executeCommandMock.calledOnce, true, 'executeCommand should be called once');
      assert.strictEqual(
        executeCommandMock.args[0][0],
        firstProjectPath,
        'executeCommand should be called with correct arguments'
      );
      assert.strictEqual(
        executeCommandMock.args[0][1],
        'npx',
        'executeCommand should be called with correct arguments'
      );
      assert.strictEqual(
        executeCommandMock.args[0][2],
        RequiredApps.truffle,
        'executeCommand should be called with correct arguments'
      );
      assert.strictEqual(
        executeCommandMock.args[0][3],
        'init',
        'executeCommand should be called with correct arguments'
      );
      assert.strictEqual(updateWorkspaceFoldersMock.calledOnce, true, 'updateWorkspaceFolders should be called once');
      assert.strictEqual(
        updateWorkspaceFoldersMock.args[0][0],
        0,
        'updateWorkspaceFolders should be called with correct arguments'
      );
      assert.strictEqual(
        updateWorkspaceFoldersMock.args[0][1],
        1,
        'updateWorkspaceFolders should be called with correct arguments'
      );
      assert.strictEqual(
        updateWorkspaceFoldersMock.args[0][2].uri.path,
        `/${firstProjectPath}`,
        'updateWorkspaceFolders should be called with correct arguments'
      );
      assert.strictEqual(emptyDirSyncMock.notCalled, true, 'emptyDirSync should not be called');
    });

    it('Method newSolidityProject runs method createProject, and a new sample project was created successfully.', async () => {
      // Arrange
      checkRequiredAppsMock.returns(true);
      readdirMock.returns([]);
      sinon.stub(workspace, 'workspaceFolders').value(['1']);

      const projectCommandsRewire = rewire('../../src/commands/ProjectCommands');
      const createProject = projectCommandsRewire.__get__('createProject');

      showErrorMessageMock.returns(Constants.informationMessage.openButton);
      showQuickPickMock.returns({
        cmd: createProject,
        label: Constants.typeOfSolidityProject.text.sampleProject,
        detail: Constants.typeOfSolidityProject.description.sampleProject,
        projectType: ProjectType.sample,
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
        'ensureDir should be called with correct arguments'
      );
      assert.strictEqual(readdirMock.calledOnce, true, 'readdir should be called once');
      assert.strictEqual(readdirMock.args[0][0], firstProjectPath, 'readdir should be called with correct arguments');
      assert.strictEqual(showErrorMessageMock.notCalled, true, 'showErrorMessage should not be called');
      assert.strictEqual(executeCommandMock.calledOnce, true, 'executeCommand should be called once');
      assert.strictEqual(
        executeCommandMock.args[0][0],
        firstProjectPath,
        'executeCommand should be called with correct arguments'
      );
      assert.strictEqual(
        executeCommandMock.args[0][1],
        'npx',
        'executeCommand should be called with correct arguments'
      );
      assert.strictEqual(
        executeCommandMock.args[0][2],
        RequiredApps.truffle,
        'executeCommand should be called with correct arguments'
      );
      assert.strictEqual(
        executeCommandMock.args[0][3],
        'unbox',
        'executeCommand should be called with correct arguments'
      );
      assert.strictEqual(
        executeCommandMock.args[0][4],
        Constants.sampleTruffleBox,
        'executeCommand should be called with correct arguments'
      );
      assert.strictEqual(updateWorkspaceFoldersMock.calledOnce, true, 'updateWorkspaceFolders should be called once');
      assert.strictEqual(
        updateWorkspaceFoldersMock.args[0][0],
        0,
        'updateWorkspaceFolders should be called with correct arguments'
      );
      assert.strictEqual(
        updateWorkspaceFoldersMock.args[0][1],
        1,
        'updateWorkspaceFolders should be called with correct arguments'
      );
      assert.strictEqual(
        updateWorkspaceFoldersMock.args[0][2].uri.path,
        `/${firstProjectPath}`,
        'updateWorkspaceFolders should be called with correct arguments'
      );
      assert.strictEqual(emptyDirSyncMock.notCalled, true, 'emptyDirSync should not be called');
    });

    it('Method newSolidityProject runs method createProject, and a truffle unbox project was created successfully.', async () => {
      // Arrange
      checkRequiredAppsMock.returns(true);
      readdirMock.returns([]);
      sinon.stub(workspace, 'workspaceFolders').value(['1']);

      const projectCommandsRewire = rewire('../../src/commands/ProjectCommands');
      const createProject = projectCommandsRewire.__get__('createProject');
      projectCommandsRewire.__set__('getTruffleUnboxCommand', sinon.mock().returns(truffleBoxName));
      const getTruffleUnboxCommandMock = projectCommandsRewire.__get__('getTruffleUnboxCommand');

      showErrorMessageMock.returns(Constants.informationMessage.openButton);
      showQuickPickMock.returns({
        cmd: createProject,
        label: Constants.typeOfSolidityProject.text.projectFromTruffleBox,
        detail: Constants.typeOfSolidityProject.description.projectFromTruffleBox,
        projectType: ProjectType.box,
      });

      // Act
      await projectCommandsRewire.ProjectCommands.newSolidityProject();

      // Assert
      assert.strictEqual(checkRequiredAppsMock.calledOnce, true, 'checkRequiredApps should be called once');
      assert.strictEqual(showQuickPickMock.calledOnce, true, 'showQuickPick should be called once');
      assert.strictEqual(gitInitMock.calledOnce, true, 'gitInit should be called once');
      assert.strictEqual(gitInitMock.args[0][0], firstProjectPath, 'gitInit should be called with correct arguments');
      assert.strictEqual(getTruffleUnboxCommandMock.calledOnce, true, 'getTruffleUnboxCommand should be called once');
      assert.strictEqual(showOpenFolderDialogMock.calledOnce, true, 'showOpenFolderDialog should be called once');
      assert.strictEqual(ensureDirMock.calledOnce, true, 'ensureDir should be called once');
      assert.strictEqual(
        ensureDirMock.args[0][0],
        firstProjectPath,
        'ensureDir should be called with correct arguments'
      );
      assert.strictEqual(readdirMock.calledOnce, true, 'readdir should be called once');
      assert.strictEqual(readdirMock.args[0][0], firstProjectPath, 'readdir should be called with correct arguments');
      assert.strictEqual(showErrorMessageMock.notCalled, true, 'showErrorMessage should not be called');
      assert.strictEqual(executeCommandMock.calledOnce, true, 'executeCommand should be called once');
      assert.strictEqual(
        executeCommandMock.args[0][0],
        firstProjectPath,
        'executeCommand should be called with correct arguments'
      );
      assert.strictEqual(
        executeCommandMock.args[0][1],
        'npx',
        'executeCommand should be called with correct arguments'
      );
      assert.strictEqual(
        executeCommandMock.args[0][2],
        RequiredApps.truffle,
        'executeCommand should be called with correct arguments'
      );
      assert.strictEqual(
        executeCommandMock.args[0][3],
        'unbox',
        'executeCommand should be called with correct arguments'
      );
      assert.strictEqual(
        executeCommandMock.args[0][4],
        truffleBoxName,
        'executeCommand should be called with correct arguments'
      );
      assert.strictEqual(updateWorkspaceFoldersMock.calledOnce, true, 'updateWorkspaceFolders should be called once');
      assert.strictEqual(
        updateWorkspaceFoldersMock.args[0][0],
        0,
        'updateWorkspaceFolders should be called with correct arguments'
      );
      assert.strictEqual(
        updateWorkspaceFoldersMock.args[0][1],
        1,
        'updateWorkspaceFolders should be called with correct arguments'
      );
      assert.strictEqual(
        updateWorkspaceFoldersMock.args[0][2].uri.path,
        `/${firstProjectPath}`,
        'updateWorkspaceFolders should be called with correct arguments'
      );
      assert.strictEqual(emptyDirSyncMock.notCalled, true, 'emptyDirSync should not be called');
    });

    it('Method newSolidityProject runs method createProject, and a new empty project throws error.', async () => {
      // Arrange
      checkRequiredAppsMock.returns(true);
      readdirMock.returns([]);
      executeCommandMock.throws();

      const projectCommandsRewire = rewire('../../src/commands/ProjectCommands');
      const createProject = projectCommandsRewire.__get__('createProject');
      showErrorMessageMock.returns(Constants.informationMessage.openButton);
      showQuickPickMock.returns({
        cmd: createProject,
        label: Constants.typeOfSolidityProject.text.emptyProject,
        detail: Constants.typeOfSolidityProject.description.emptyProject,
        projectType: ProjectType.empty,
      });

      // Act
      const action = async () => {
        await projectCommandsRewire.ProjectCommands.newSolidityProject();
      };

      // Assert
      await assert.rejects(action, Error, Constants.errorMessageStrings.NewProjectCreationFailed);
      assert.strictEqual(checkRequiredAppsMock.calledOnce, true, 'checkRequiredApps should be called once');
      assert.strictEqual(showQuickPickMock.calledOnce, true, 'showQuickPick should be called once');
      assert.strictEqual(gitInitMock.notCalled, true, 'gitInit should not be called');
      assert.strictEqual(showOpenFolderDialogMock.calledOnce, true, 'showOpenFolderDialog should be called once');
      assert.strictEqual(ensureDirMock.calledOnce, true, 'ensureDir should be called once');
      assert.strictEqual(
        ensureDirMock.args[0][0],
        firstProjectPath,
        'ensureDir should be called with correct arguments'
      );
      assert.strictEqual(readdirMock.calledOnce, true, 'readdir should be called once');
      assert.strictEqual(readdirMock.args[0][0], firstProjectPath, 'readdir should be called with correct arguments');
      assert.strictEqual(showErrorMessageMock.notCalled, true, 'showErrorMessage should not be called');
      assert.strictEqual(executeCommandMock.calledOnce, true, 'executeCommand should be called once');
      assert.strictEqual(
        executeCommandMock.args[0][0],
        firstProjectPath,
        'executeCommand should be called with correct arguments'
      );
      assert.strictEqual(
        executeCommandMock.args[0][1],
        'npx',
        'executeCommand should be called with correct arguments'
      );
      assert.strictEqual(
        executeCommandMock.args[0][2],
        RequiredApps.truffle,
        'executeCommand should be called with correct arguments'
      );
      assert.strictEqual(
        executeCommandMock.args[0][3],
        'init',
        'executeCommand should be called with correct arguments'
      );
      assert.strictEqual(updateWorkspaceFoldersMock.notCalled, true, 'updateWorkspaceFolders should not be called');
      assert.strictEqual(emptyDirSyncMock.calledOnce, true, 'emptyDirSync should be called once');
      assert.strictEqual(
        emptyDirSyncMock.args[0][0],
        firstProjectPath,
        'emptyDirSync should be called with correct arguments'
      );
    });

    it(
      'Method newSolidityProject get truffleBoxName and create new project with this name. ' +
        'showInputBox called twice in getTruffleUnboxCommand.',
      async () => {
        // Arrange
        checkRequiredAppsMock.returns(true);
        readdirMock.returns([]);
        executeCommandMock.throws();

        const projectCommandsRewire = rewire('../../src/commands/ProjectCommands');
        const createProject = projectCommandsRewire.__get__('createProject');
        projectCommandsRewire.__set__('getTruffleUnboxCommand', sinon.mock().returns(truffleBoxName));
        const getTruffleUnboxCommandMock = projectCommandsRewire.__get__('getTruffleUnboxCommand');

        showErrorMessageMock.returns(Constants.informationMessage.openButton);
        showQuickPickMock.returns({
          cmd: createProject,
          label: Constants.typeOfSolidityProject.text.projectFromTruffleBox,
          detail: Constants.typeOfSolidityProject.description.projectFromTruffleBox,
          projectType: ProjectType.box,
        });

        // Act
        const action = async () => {
          await projectCommandsRewire.ProjectCommands.newSolidityProject();
        };

        // Assert
        await assert.rejects(action, Error, Constants.errorMessageStrings.NewProjectCreationFailed);
        assert.strictEqual(checkRequiredAppsMock.calledOnce, true, 'checkRequiredApps should be called once');
        assert.strictEqual(showQuickPickMock.calledOnce, true, 'showQuickPick should be called once');
        assert.strictEqual(gitInitMock.notCalled, true, 'gitInit should not be called');
        assert.strictEqual(getTruffleUnboxCommandMock.calledOnce, true, 'getTruffleUnboxCommand should be called once');
        assert.strictEqual(showOpenFolderDialogMock.calledOnce, true, 'showOpenFolderDialog should be called once');
        assert.strictEqual(ensureDirMock.calledOnce, true, 'ensureDir should be called once');
        assert.strictEqual(
          ensureDirMock.args[0][0],
          firstProjectPath,
          'ensureDir should be called with correct arguments'
        );
        assert.strictEqual(readdirMock.calledOnce, true, 'readdir should be called once');
        assert.strictEqual(readdirMock.args[0][0], firstProjectPath, 'readdir should be called with correct arguments');
        assert.strictEqual(showErrorMessageMock.notCalled, true, 'showErrorMessage should not be called');
        assert.strictEqual(executeCommandMock.calledOnce, true, 'executeCommand should be called once');
        assert.strictEqual(
          executeCommandMock.args[0][0],
          firstProjectPath,
          'executeCommand should be called with correct arguments'
        );
        assert.strictEqual(
          executeCommandMock.args[0][1],
          'npx',
          'executeCommand should be called with correct arguments'
        );
        assert.strictEqual(
          executeCommandMock.args[0][2],
          RequiredApps.truffle,
          'executeCommand should be called with correct arguments'
        );
        assert.strictEqual(
          executeCommandMock.args[0][3],
          'unbox',
          'executeCommand should be called with correct arguments'
        );
        assert.strictEqual(
          executeCommandMock.args[0][4],
          truffleBoxName,
          'executeCommand should be called with correct arguments'
        );
        assert.strictEqual(updateWorkspaceFoldersMock.notCalled, true, 'updateWorkspaceFolders should not be called');
        assert.strictEqual(emptyDirSyncMock.calledOnce, true, 'emptyDirSync should be called once');
        assert.strictEqual(
          emptyDirSyncMock.args[0][0],
          firstProjectPath,
          'emptyDirSync should be called with correct arguments'
        );
      }
    );
  });
});
