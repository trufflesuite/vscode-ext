// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { QuickPickItem } from 'vscode';
import { Constants } from '../Constants';
import { showInputBox, showQuickPick } from '../helpers';
import { InfuraProjectItem } from '../Models/QuickPickItems';
import { InfuraNetworkNode, InfuraProject } from '../Models/TreeItems';
import { IInfuraEndpointDto, IInfuraProjectDto, IProjectsResultDto } from '../services/infuraService/InfuraDto';
import { InfuraServiceClient } from '../services/infuraService/InfuraServiceClient';
import { Telemetry } from '../TelemetryClient';

export class InfuraResourceExplorer {
  public async createProject(existingProjects: string[] = [])
  : Promise<InfuraProject> {
    Telemetry.sendEvent('InfuraResourceExplorer.createProject');
    return this.createInfuraProject(existingProjects);
  }

  public async selectProject(existingProjects: string[] = [], existingProjectIds: string[] = [])
  : Promise<InfuraProject> {
    Telemetry.sendEvent('InfuraResourceExplorer.selectProject');
    const projectDestination = await showQuickPick(
      this.getProjectDestinations(existingProjectIds),
      {
        ignoreFocusOut: true,
        placeHolder: Constants.placeholders.selectInfuraProject,
      });

    if (projectDestination instanceof InfuraProjectItem) {
      Telemetry.sendEvent('InfuraResourceExplorer.selectProject.selectInfuraProject');
      return this.getInfuraProject(
        projectDestination.label,
        projectDestination.projectId,
        projectDestination.endpoints);
    } else {
      Telemetry.sendEvent('InfuraResourceExplorer.selectProject.creatInfuraProject');
      return this.createInfuraProject(existingProjects);
    }
  }

  private async getProjectDestinations(existingProjectIds: string[]): Promise<QuickPickItem[]> {
    const createInfuraProjectItem: QuickPickItem = { label: Constants.uiCommandStrings.createInfuraProject };
    const infuraProjectItems = await this.loadInfuraProjectItems(existingProjectIds);

    return [createInfuraProjectItem, ...infuraProjectItems];
  }

  private async loadInfuraProjectItems(existingProjectIds: string[]): Promise<InfuraProjectItem[]> {
    const listOfProject: IProjectsResultDto = await InfuraServiceClient.getProjects();

    return listOfProject.projects
    .map((project: IInfuraProjectDto) => new InfuraProjectItem(project.name, project.id, project.endpoints))
    .filter((item) => !existingProjectIds.includes(item.projectId));
  }

  private async createInfuraProject(existingProjects: string[]): Promise<InfuraProject> {
    const projectName = await this.getProjectName(existingProjects);
    const projectAvailability = await this.getProjectAvailability();

    const newProject = await InfuraServiceClient.createProject({
      name: projectName,
      private_only: projectAvailability,
    });

    const projectDetails = await InfuraServiceClient.getProjectDetails(newProject.id);

    return this.getInfuraProject(newProject.name, newProject.id, projectDetails.endpoints);
  }

  private async getProjectName(existingProjects: string[]): Promise<string> {
    const listOfProject: IProjectsResultDto = await InfuraServiceClient.getProjects();
    const listOfProjectNames = listOfProject.projects.map((project) => project.name);

    return showInputBox({
      ignoreFocusOut: true,
      prompt: Constants.paletteLabels.enterInfuraProjectName,
      validateInput: async (value: string) => {
        if (value === '') {
          return Constants.validationMessages.valueCannotBeEmpty;
        }

        if (existingProjects.includes(value)) {
          return Constants.validationMessages.projectAlreadyExists;
        }

        if (!value.match(Constants.validationRegexps.infuraProjectname)) {
          return Constants.validationMessages.infuraProjectInvalidName;
        }

        if (listOfProjectNames.includes(value)) {
          return Constants.validationMessages.projectAlreadyExistsOnInfura;
        }

        return;
      },
    });
  }

  private async getProjectAvailability(): Promise<boolean> {
    const answer = await showQuickPick(
      [
        { label: Constants.projectAvailability.public },
        { label: Constants.projectAvailability.private },
      ],
      {
        ignoreFocusOut: true,
        placeHolder: `${Constants.placeholders.selectInfuraProjectAvailability}.`,
      },
    );

    return answer.label === Constants.projectAvailability.private ? true : false;
  }

  private async getInfuraProject(projectName: string, projectId: string, endpoints: IInfuraEndpointDto)
  : Promise<InfuraProject> {
    const infuraNetworkNodes: InfuraNetworkNode[] = [];

    for (const [key, value] of Object.entries(endpoints)) {
      infuraNetworkNodes.push(new InfuraNetworkNode(key, value.https, Constants.infuraEndpointsIds[key]));
    }

    const infuraProject = new InfuraProject(projectName, projectId);
    infuraProject.setChildren(
      infuraNetworkNodes.sort((first, second) => (first.networkId as number) - (second.networkId as number)),
    );

    return infuraProject;
  }
}
