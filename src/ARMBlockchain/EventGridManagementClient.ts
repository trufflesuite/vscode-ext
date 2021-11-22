// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import { ServiceClientCredentials } from "ms-rest";
import { AzureServiceClientOptions, UserTokenCredentials } from "ms-rest-azure";
import { Constants } from "../Constants";
import { BaseClient } from "./BaseClient";
import { EventGridResource } from "./Operations/EventGridResource";

export class EventGridManagementClient extends BaseClient {
  public eventGridResource: EventGridResource;

  constructor(
    credentials: ServiceClientCredentials | UserTokenCredentials,
    subscriptionId: string,
    resourceGroup: string,
    location: string,
    baseUri: string,
    options: AzureServiceClientOptions
  ) {
    super(credentials, subscriptionId, resourceGroup, location, baseUri, options);

    this.eventGridResource = new EventGridResource(this);
  }

  public getEventGridList(callback: (error: Error | null, result?: any) => void): Promise<void> {
    const url = this.getUrl("topics");

    const httpRequest = this.getHttpRequest(url, "GET");
    return this.sendRequestToAzure(httpRequest, callback);
  }

  public getEventGridItem(eventGridName: string, callback: (error: Error | null, result?: any) => void): Promise<void> {
    const url = this.getUrl(`topics/${eventGridName}`);

    const httpRequest = this.getHttpRequest(url, "GET");

    return this.sendRequestToAzure(httpRequest, callback);
  }

  public createEventGrid(
    eventGridName: string,
    body: string,
    callback: (error: Error | null, result?: any) => void
  ): Promise<void> {
    const url = this.getUrl(`topics/${eventGridName}`);

    const httpRequest = this.getHttpRequest(url, "PUT", body);

    return this.sendRequestToAzure(httpRequest, callback);
  }

  private getUrl(mainPartOfUrl: string): string {
    return (
      `${this.baseUri}/subscriptions/${this.subscriptionId}/resourceGroups/${this.resourceGroup}/providers` +
      `/${Constants.azureProviders.eventGrid}/${mainPartOfUrl}?api-version=${Constants.azureApiVersions.preview20200101}`
    );
  }
}
