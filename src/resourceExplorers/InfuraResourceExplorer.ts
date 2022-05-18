// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {QuickPickItem, window} from "vscode";
import {Constants} from "../Constants";
import {showInputBox, showQuickPick} from "../helpers";
import {InfuraProjectItem} from "../Models/QuickPickItems";
import {InfuraNetworkNode, InfuraProject} from "../Models/TreeItems";
import {InfuraLayer} from "../Models/TreeItems/InfuraLayer";
import {IInfuraEndpointDto, IInfuraProjectDto, IInfuraProjectQuickPick} from "../services/infuraService/InfuraDto";
import {InfuraServiceClient} from "../services/infuraService/InfuraServiceClient";
import {Telemetry} from "../TelemetryClient";

export class InfuraResourceExplorer {
  public async createProject(existingProjects: string[] = []): Promise<InfuraProject> {
    Telemetry.sendEvent("InfuraResourceExplorer.createProject");
    await this.waitForLogin();

    return this.createInfuraProject(existingProjects);
  }

  public async selectProject(
    existingProjects: string[] = [],
    existingProjectIds: string[] = []
  ): Promise<InfuraProject> {
    Telemetry.sendEvent("InfuraResourceExplorer.selectProject");
    await this.waitForLogin();

    const projectDestination = await showQuickPick(this.getProjectDestinations(existingProjectIds), {
      ignoreFocusOut: true,
      placeHolder: Constants.placeholders.selectInfuraProject,
    });

    if (projectDestination instanceof InfuraProjectItem) {
      Telemetry.sendEvent("InfuraResourceExplorer.selectProject.selectInfuraProject");
      return this.getInfuraProject(
        projectDestination.label,
        projectDestination.projectId,
        projectDestination.endpoints
      );
    } else {
      Telemetry.sendEvent("InfuraResourceExplorer.selectProject.creatInfuraProject");
      return this.createInfuraProject(existingProjects);
    }
  }

  public async getProjectsForQuickPick(): Promise<IInfuraProjectQuickPick[]> {
    const allProjects = await InfuraServiceClient.getProjects();
    const excludedProjects = InfuraServiceClient.getExcludedProjects();

    return allProjects.map((project: IInfuraProjectDto) => {
      return {
        ...project,
        label: project.name,
        picked: !excludedProjects.some((excluded) => excluded.id === project.id),
      };
    });
  }

  private async getProjectDestinations(existingProjectIds: string[]): Promise<QuickPickItem[]> {
    const createInfuraProjectItem: QuickPickItem = {label: Constants.uiCommandStrings.createInfuraProject};
    const infuraProjectItems = await this.loadInfuraProjectItems(existingProjectIds);

    return [createInfuraProjectItem, ...infuraProjectItems];
  }

  private async loadInfuraProjectItems(existingProjectIds: string[]): Promise<InfuraProjectItem[]> {
    const listOfProject: IInfuraProjectDto[] = await InfuraServiceClient.getAllowedProjects();

    return listOfProject
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
    const listOfProject = await InfuraServiceClient.getProjects();
    const listOfProjectNames = listOfProject.map((project) => project.name);

    return showInputBox({
      ignoreFocusOut: true,
      prompt: Constants.paletteLabels.enterInfuraProjectName,
      validateInput: async (value: string) => {
        if (value === "") {
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
      [{label: Constants.projectAvailability.public}, {label: Constants.projectAvailability.private}],
      {
        ignoreFocusOut: true,
        placeHolder: `${Constants.placeholders.selectInfuraProjectAvailability}.`,
      }
    );

    return answer.label === Constants.projectAvailability.private ? true : false;
  }

  private async getInfuraProject(
    projectName: string,
    projectId: string,
    endpoints: IInfuraEndpointDto
  ): Promise<InfuraProject> {
    const infuraProject = new InfuraProject(projectName, projectId);
    const infuraNetworkNodesLayerOne: InfuraNetworkNode[] = [];
    const infuraNetworkNodesLayerTwo: InfuraNetworkNode[] = [];
    const layers = {
      [Constants.treeItemData.layer.infura.layerOne.value]: (
        label: string,
        url: string | URL,
        networkId: string | number
      ) => infuraNetworkNodesLayerOne.push(new InfuraNetworkNode(label, url, networkId)),
      [Constants.treeItemData.layer.infura.layerTwo.value]: (
        label: string,
        url: string | URL,
        networkId: string | number
      ) => infuraNetworkNodesLayerTwo.push(new InfuraNetworkNode(label, url, networkId)),
    };

    let layer: number = Constants.treeItemData.layer.infura.layerOne.value;

    for (const [key, value] of Object.entries(endpoints)) {
      layer = value.layer ? value.layer : layer;
      layers[layer](key, value.https, Constants.infuraEndpointsIds[key]);
    }

    const InfuraLayerOne = new InfuraLayer(Constants.treeItemData.layer.infura.layerOne.label);
    infuraProject.addChild(InfuraLayerOne);
    InfuraLayerOne.setChildren(infuraNetworkNodesLayerOne);

    if (infuraNetworkNodesLayerTwo.length > 0) {
      const InfuraLayerTwo = new InfuraLayer(Constants.treeItemData.layer.infura.layerTwo.label);
      infuraProject.addChild(InfuraLayerTwo);
      InfuraLayerTwo.setChildren(infuraNetworkNodesLayerTwo);
    }

    return infuraProject;
  }

  private async waitForLogin(): Promise<void> {
    const isSignedIn = await InfuraServiceClient.isSignedIn();
    if (isSignedIn) {
      return;
    }

    const shouldSignIn = await window.showInformationMessage(
      Constants.informationMessage.infuraSignInPrompt,
      Constants.informationMessage.signInButton
    );

    if (shouldSignIn) {
      await InfuraServiceClient.signIn();
    } else {
      const error = new Error(Constants.errorMessageStrings.InfuraUnauthorized);
      Telemetry.sendException(error);
      throw error;
    }
  }
}
