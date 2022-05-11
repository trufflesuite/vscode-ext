// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Constants} from "../Constants";
import {showInputBox} from "../helpers";
import {QuorumNetworkNode, QuorumProject} from "../Models/TreeItems";
import {GanacheService} from "../services";
import {Telemetry} from "../TelemetryClient";
import {DialogResultValidator} from "../validators/DialogResultValidator";
import {UrlValidator} from "../validators/UrlValidator";

export class QuorumResourceExplorer {
  public async createProject(existingProjects: string[] = [], existingPorts: number[] = []): Promise<QuorumProject> {
    Telemetry.sendEvent("QuorumResourceExplorer.createProject");
    return this.getOrCreateQuorumProject(
      existingProjects,
      existingPorts,
      GanacheService.PortStatus.FREE,
      Constants.validationMessages.portAlreadyInUse
    );
  }

  public async selectProject(existingProjects: string[] = [], existingPorts: number[] = []): Promise<QuorumProject> {
    Telemetry.sendEvent("QuorumResourceExplorer.selectProject");
    const quorumProject = await this.getOrCreateQuorumProject(
      existingProjects,
      existingPorts,
      GanacheService.PortStatus.GANACHE,
      Constants.validationMessages.portNotInUseQuorum
    );

    // await GanacheService.startGanacheServer(localProject.port);

    return quorumProject;
  }

  private async getOrCreateQuorumProject(
    existingProjects: string[],
    existingPorts: number[],
    portStatus: GanacheService.PortStatus,
    validateMessage: string
  ): Promise<QuorumProject> {
    const localProjectName = await this.getQuorumProjectName(existingProjects);
    const localProjectPort = await this.getQuorumProjectPort(existingPorts, portStatus, validateMessage);

    return this.getQuorumProject(localProjectName, localProjectPort);
  }

  private async getQuorumProjectName(existingProjects: string[]): Promise<string> {
    return showInputBox({
      ignoreFocusOut: true,
      prompt: Constants.paletteLabels.enterLocalProjectName,
      validateInput: (value: string) => {
        const validationError = DialogResultValidator.validateLocalNetworkName(value);
        if (validationError) {
          return validationError;
        }

        if (existingProjects.some((existName) => existName === value)) {
          return Constants.validationMessages.nameAlreadyInUse;
        }

        return null;
      },
      value: existingProjects.includes(Constants.localhostName) ? "" : Constants.localhostName,
    });
  }

  private async getQuorumProjectPort(
    existingPorts: number[],
    portStatus: GanacheService.PortStatus,
    validateMessage: string
  ): Promise<number> {
    const port = await showInputBox({
      ignoreFocusOut: true,
      prompt: Constants.paletteLabels.enterLocalProjectPort,
      validateInput: async (value: string) => {
        const validationError = UrlValidator.validatePort(value);
        if (validationError) {
          return validationError;
        }

        if (existingPorts.some((existPort) => existPort + "" === value)) {
          return Constants.validationMessages.projectAlreadyExists;
        }

        if ((await GanacheService.getPortStatus(value)) !== portStatus) {
          return validateMessage;
        }

        return null;
      },
      value: existingPorts.includes(Constants.defaultLocalhostPort) ? "" : Constants.defaultLocalhostPort.toString(),
    });

    return parseInt(port, 10);
  }

  private async getQuorumProject(projectName: string, port: number): Promise<QuorumProject> {
    const quorumProject = new QuorumProject(projectName, port);
    const url = `${Constants.networkProtocols.http}${Constants.localhost}:${port}`;
    const networkNode = new QuorumNetworkNode(projectName, url, "*");

    quorumProject.addChild(networkNode);

    return quorumProject;
  }
}
