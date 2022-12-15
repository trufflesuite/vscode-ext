// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {commands, window} from 'vscode';
import {Constants, RequiredApps} from '../Constants';
import {required} from '../helpers/required';
import {GenericProject} from '../Models/TreeItems/GenericProject';
import {GenericService} from '@/services/generic/GenericService';
import {TreeManager} from '@/services/tree/TreeManager';
import {Telemetry} from '../TelemetryClient';
import {ProjectView} from '@/ViewItems/ProjectView';

export namespace GenericCommands {
  // Command to bind to UI commands
  export async function checkForConnection(projectView?: ProjectView): Promise<void> {
    Telemetry.sendEvent('GenericCommands.checkForConnection.commandStarted');

    if (!(await required.checkApps(RequiredApps.node))) {
      Telemetry.sendEvent('GenericCommands.checkForConnection.nodeIsNotInstalled');
      void commands.executeCommand('truffle-vscode.showRequirementsPage');
      return;
    }

    const project: GenericProject = projectView?.extensionItem as GenericProject;
    project.description = await GenericService.getClientVersion(project.port);

    void window.showInformationMessage(Constants.genericCommandStrings.serverRunning);

    TreeManager.saveState();
    await commands.executeCommand('truffle-vscode.refresh');

    Telemetry.sendEvent('GenericCommands.checkForConnection.commandFinished');
  }
}
