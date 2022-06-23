// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {QuickPickItem} from "vscode";
import {IInfuraEndpointDto} from "../../services/infuraService/InfuraDto/IInfuraEndpointDto";

export class InfuraProjectItem implements QuickPickItem {
  public readonly label: string;
  public readonly description: string;
  public readonly projectId: string;
  public readonly endpoints: IInfuraEndpointDto;

  constructor(label: string, projectId: string, endpoints: IInfuraEndpointDto, description?: string) {
    this.label = label;
    this.description = description || "";
    this.projectId = projectId;
    this.endpoints = endpoints;
  }
}
