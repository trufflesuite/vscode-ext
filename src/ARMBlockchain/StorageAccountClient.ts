// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import { ServiceClientCredentials } from "ms-rest";
import { AzureServiceClientOptions, UserTokenCredentials } from "ms-rest-azure";
import { Constants } from "../Constants";
import { BaseClient } from "./BaseClient";
import { StorageResource } from "./Operations/StorageResource";

export class StorageAccountClient extends BaseClient {
  public storageResource: StorageResource;

  constructor(
    credentials: ServiceClientCredentials | UserTokenCredentials,
    subscriptionId: string,
    resourceGroup: string,
    location: string,
    baseUri: string,
    options: AzureServiceClientOptions
  ) {
    super(credentials, subscriptionId, resourceGroup, location, baseUri, options);

    this.storageResource = new StorageResource(this);
  }

  public getStorageAccountList(callback: (error: Error | null, result?: any) => void): Promise<void> {
    const url = this.getUrl("");

    const httpRequest = this.getHttpRequest(url, "GET");

    return this.sendRequestToAzure(httpRequest, callback);
  }

  public getListAccountSas(
    accountName: string,
    body: string,
    callback: (error: Error | null, result?: any) => void
  ): Promise<void> {
    const url = this.getUrl(`/${accountName}/ListAccountSas`);

    const httpRequest = this.getHttpRequest(url, "POST", body);

    return this.sendRequestToAzure(httpRequest, callback);
  }

  public createStorageAccount(
    accountName: string,
    body: string,
    callback: (error: Error | null, result?: any) => void
  ): Promise<void> {
    const url = this.getUrl(`/${accountName}`);

    const httpRequest = this.getHttpRequest(url, "PUT", body);

    return this.sendRequestToAzure(httpRequest, callback);
  }

  public getStorageAccount(accountName: string, callback: (error: Error | null, result?: any) => void): Promise<void> {
    const url = this.getUrl(`/${accountName}`);

    const httpRequest = this.getHttpRequest(url, "GET");

    return this.sendRequestToAzure(httpRequest, callback);
  }

  private getUrl(mainPartOfUrl: string, addResourceGroups: boolean = true): string {
    const resourceGroup = addResourceGroups ? `/resourceGroups/${this.resourceGroup}` : "";

    return (
      `${this.baseUri}/subscriptions/${this.subscriptionId}${resourceGroup}/providers` +
      `/${Constants.azureProviders.storage}/storageAccounts${mainPartOfUrl}?api-version=${Constants.azureApiVersions[20190601]}`
    );
  }
}
