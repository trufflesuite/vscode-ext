// Copyright (c) 2022. Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Constants} from '@/Constants';
import {showInputBox} from '@/helpers/userInteraction';
import {GenericNetworkNode} from '@/Models/TreeItems/GenericNetworkNode';
import {GenericProject} from '@/Models/TreeItems/GenericProject';
import {GenericService} from '@/services/generic/GenericService';
import {Telemetry} from '@/TelemetryClient';
import {DialogResultValidator} from '@/validators/DialogResultValidator';
import {UrlValidator} from '@/validators/UrlValidator';

export class GenericResourceExplorer {
  public async selectProject(existingProjects: string[] = [], existingPorts: number[] = []): Promise<GenericProject> {
    Telemetry.sendEvent('GenericResourceExplorer.selectProject');
    const genericProject = await this.getOrCreateGenericProject(
      existingProjects,
      existingPorts,
      GenericService.PortStatus.RUNNING,
      Constants.validationMessages.portNotInUseGeneric
    );

    genericProject.description = await GenericService.getClientVersion(genericProject.port);

    return genericProject;
  }

  private async getOrCreateGenericProject(
    existingProjects: string[],
    existingPorts: number[],
    portStatus: GenericService.PortStatus,
    validateMessage: string
  ): Promise<GenericProject> {
    const localProjectName = await this.getGenericProjectName(existingProjects);
    const localProjectPort = await this.getGenericProjectPort(existingPorts, portStatus, validateMessage);

    return this.getGenericProject(localProjectName, localProjectPort);
  }

  private async getGenericProjectName(existingProjects: string[]): Promise<string> {
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
      value: existingProjects.includes(Constants.localhostName) ? '' : Constants.localhostName,
    });
  }

  private async getGenericProjectPort(
    existingPorts: number[],
    portStatus: GenericService.PortStatus,
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

        if (existingPorts.some((existPort) => existPort + '' === value)) {
          return Constants.validationMessages.projectAlreadyExists;
        }

        if ((await GenericService.getPortStatus(value)) !== portStatus) {
          return validateMessage;
        }

        return null;
      },
      value: existingPorts.includes(Constants.defaultLocalhostPort) ? '' : Constants.defaultLocalhostPort.toString(),
    });

    return parseInt(port, 10);
  }

  private async getGenericProject(projectName: string, port: number): Promise<GenericProject> {
    const genericProject = new GenericProject(projectName, port);
    const url = `${Constants.networkProtocols.http}${Constants.localhost}:${port}`;
    const networkNode = new GenericNetworkNode(projectName, url, '*');

    genericProject.addChild(networkNode);

    return genericProject;
  }
}
