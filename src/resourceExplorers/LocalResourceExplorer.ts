// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Constants} from "../Constants";
import {showInputBox} from "../helpers/userInteraction";
import {LocalNetworkNode, LocalProject, TLocalProjectOptions} from "../Models/TreeItems";
import {GanacheService} from "../services";
import {Telemetry} from "../TelemetryClient";
import {DialogResultValidator} from "../validators/DialogResultValidator";
import {UrlValidator} from "../validators/UrlValidator";

export class LocalResourceExplorer {
  public async createProject(
    existingProjects: string[] = [],
    existingPorts: number[] = [],
    options: TLocalProjectOptions
  ): Promise<LocalProject> {
    Telemetry.sendEvent("LocalResourceExplorer.createProject");

    return this.getOrCreateLocalProject(
      existingProjects,
      existingPorts,
      GanacheService.PortStatus.FREE,
      Constants.validationMessages.portAlreadyInUse,
      options
    );
  }

  public async selectProject(
    existingProjects: string[] = [],
    existingPorts: number[] = [],
    options: TLocalProjectOptions
  ): Promise<LocalProject> {
    Telemetry.sendEvent("LocalResourceExplorer.selectProject");

    const localProject = await this.getOrCreateLocalProject(
      existingProjects,
      existingPorts,
      GanacheService.PortStatus.GANACHE,
      Constants.validationMessages.portNotInUseGanache,
      options
    );

    await GanacheService.startGanacheServer(localProject.port);

    return localProject;
  }

  private async getOrCreateLocalProject(
    existingProjects: string[],
    existingPorts: number[],
    portStatus: GanacheService.PortStatus,
    validateMessage: string,
    options: TLocalProjectOptions
  ): Promise<LocalProject> {
    const port: number = await this.getLocalProjectPort(existingPorts, portStatus, validateMessage);
    const label: string = await this.getLocalProjectName(existingProjects);
    const description: string = await this.getDescription(port, options);

    return this.getLocalProject(label, port, options, description);
  }

  private async getLocalProject(
    label: string,
    port: number,
    options: TLocalProjectOptions,
    description: string
  ): Promise<LocalProject> {
    const localProject = new LocalProject(label, port, options, description);
    const url = `${Constants.networkProtocols.http}${Constants.localhost}:${port}`;
    const networkNode = new LocalNetworkNode(label, url, "*");

    localProject.addChild(networkNode);

    return localProject;
  }

  private async getLocalProjectName(existingProjects: string[]): Promise<string> {
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

  private async getLocalProjectPort(
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

  private async getDescription(port: number, options: TLocalProjectOptions) {
    const blockNumber: string = options.blockNumber === 0 ? Constants.latestBlock : options.blockNumber.toString();
    const forkedNetwork: string = options.url === "" ? options.forkedNetwork : options.url;

    let formattedDescription: string;

    if (options.isForked)
      formattedDescription = `${forkedNetwork?.toLowerCase()} - ${Constants.networkProtocols.http}${
        Constants.localhost
      }:${port} forking ${forkedNetwork?.toLowerCase()}@${blockNumber}`;
    else formattedDescription = `${Constants.networkProtocols.http}${Constants.localhost}:${port}`;

    return formattedDescription;
  }
}
