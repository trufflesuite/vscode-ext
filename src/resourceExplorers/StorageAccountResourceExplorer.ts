// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as fs from 'fs-extra';
import * as path from 'path';
import { ProgressLocation, window } from 'vscode';
import { IGetStorageAccountDto, IStorageAccountDto } from '../ARMBlockchain';
import { ICreateStorageAccountDto } from '../ARMBlockchain/AzureDto/StorageAccount/CreateStorageAccountDto';
import { StorageAccountClient } from '../ARMBlockchain/StorageAccountClient';
import { Constants } from '../Constants';
import { outputCommandHelper, userSettings } from '../helpers';
import { ResourceGroupItem } from '../Models/QuickPickItems';
import { BlobServiceClient } from '../services/storageAccountService/BlobServiceClient';
import { AzureResourceExplorer } from './AzureResourceExplorer';

export class StorageAccountResourceExplorer extends AzureResourceExplorer {
  public async getFileBlobUrls(
    contentArray: string[],
    fileNameArray: string[],
    localFilePaths: string,
    subscriptionId: string,
    resourceGroup: string,
  ): Promise<string[]> {
    await this.waitForLogin();

    const client = await this.getStorageAccountClient(subscriptionId, resourceGroup);
    const storageAccountName = await this.getStorageAccountName();

    await this.createStorageAccountIfDoesNotExist(client, client.location, storageAccountName);

    const containerName = Constants.containerAzureBlockchainExtension;
    const sas = await this.getStorageAccountSas(client, storageAccountName);

    await this.createContainerIfDoesNotExist(storageAccountName, containerName, sas);

    return window.withProgress(
      { location: ProgressLocation.Window, title: Constants.statusBarMessages.createBlobs },
      async () =>
        await Promise.all(fileNameArray.map((name, index) =>
          this.createBlob(storageAccountName, containerName, name, contentArray[index], sas, localFilePaths))),
      );
  }

  public async deleteBlobs(fileUrls: string[], subscriptionId: string, resourceGroup: string, localFilePaths: string)
  : Promise<void> {
    const client = await this.getStorageAccountClient(subscriptionId, resourceGroup);

    await window.withProgress(
      { location: ProgressLocation.Window, title: Constants.statusBarMessages.deleteBlobs },
      async () => {
        await Promise.all(fileUrls.map((url) => this.deleteBlob(new URL(url), client, localFilePaths)));
      });
  }

  private async getStorageAccountName(): Promise<string> {
    let { userValue } = await userSettings.getConfigurationAsync(Constants.userSettings.storageAccountUserSettingsKey);

    if (!userValue) {
      userValue = `vscode${Date.parse(new Date().toString())}`;
      await userSettings.updateConfigurationAsync(Constants.userSettings.storageAccountUserSettingsKey, userValue);
    }

    return userValue;
  }

  private async createStorageAccountIfDoesNotExist(
    client: StorageAccountClient,
    location: string,
    storageAccountName: string)
  : Promise<void> {
    let isOnlyCheckStatus = false;

    try {
      const storageAccount = await client.storageResource.getStorageAccount(storageAccountName);
      if (storageAccount.properties.provisioningState === Constants.provisioningState.succeeded) {
        return;
      }

      isOnlyCheckStatus = true;
    } catch (error) {
      if (!(error.message && error.message.includes('ResourceNotFound'))) {
        throw error;
      }
    }

    return this.createStorageAccount(client, location, storageAccountName, isOnlyCheckStatus);
  }

  private async createStorageAccount(
    client: StorageAccountClient,
    location: string,
    storageAccountName: string,
    isOnlyCheckStatus: boolean)
  : Promise<void> {
    const body: ICreateStorageAccountDto = {
      kind: 'StorageV2',
      location,
      sku: {
        name: 'Standard_LRS',
      },
    };

    const action = async () => isOnlyCheckStatus
      ? null
      : await client.storageResource.createStorageAccount(storageAccountName, JSON.stringify(body));

    const stateRequest = async () => await client.storageResource.getStorageAccount(storageAccountName);
    const checkRequestStatusCallback = (storageAccount: IStorageAccountDto | null) => !storageAccount
      || storageAccount.properties.provisioningState === Constants.provisioningState.resolvingDns
      || storageAccount.properties.provisioningState === Constants.provisioningState.creating;

    return window.withProgress(
      { location: ProgressLocation.Window, title: Constants.statusBarMessages.createStorageAccount },
      async () => await outputCommandHelper.awaiter<IStorageAccountDto>(
        action,
        stateRequest,
        checkRequestStatusCallback,
        () => Promise.resolve(),
        5000));
  }

  private async createContainerIfDoesNotExist(storageAccountName: string, containerName: string, sas: string)
  : Promise<void> {
    try {
      await BlobServiceClient.getContainer(storageAccountName, containerName, sas);
      return;
    } catch (error) {
      if (!(error.message && error.message.includes('ContainerNotFound'))) {
        throw error;
      }
    }

    await window.withProgress(
      { location: ProgressLocation.Window, title: Constants.statusBarMessages.createContainer },
      async () => await BlobServiceClient.createContainer(storageAccountName, containerName, sas));
  }

  private async getStorageAccountSas(client: StorageAccountClient, storageAccountName: string): Promise<string> {
    // there can be some lag between generating sas and it's real availability
    const currentTime = new Date().getTime();
    const signedStart = new Date(currentTime - 30000).toISOString();
    const signedExpiry = new Date(currentTime + 3 * 60000).toISOString();

    const body: IGetStorageAccountDto = {
      keyToSign: 'key1',
      signedExpiry,
      signedPermission: 'rwdlacup',
      signedProtocol: 'https,http',
      signedResourceTypes: 'sco',
      signedServices: 'bfqt',
      signedStart,
    };

    return (await client.storageResource.getListAccountSas(storageAccountName, JSON.stringify(body))).accountSasToken;
  }

  private async createBlob(
    storageAccountName: string,
    containerName: string,
    blobName: string,
    body: string,
    sas: string,
    localFilePaths: string,
  ): Promise<string> {
    const url = await BlobServiceClient.createBlob(storageAccountName, containerName, blobName, sas, body);
    const filePath = path.join(localFilePaths, blobName);

    await fs.mkdirp(path.dirname(filePath));
    await fs.writeFile(filePath, body);

    return url;
  }

  private async deleteBlob(url: URL, client: StorageAccountClient, localFilePaths: string): Promise<void> {
    const urlWithAuth = url.origin + url.pathname;
    const fileName = urlWithAuth.substr(urlWithAuth.lastIndexOf('/') + 1);
    const storageAccountName = urlWithAuth.match(/[a-z0-9]*(?=\.blob)/)!.toString();

    const sas = await this.getStorageAccountSas(client, storageAccountName);
    await BlobServiceClient.deleteBlob(`${urlWithAuth}?${sas}`);

    const filePath = path.join(localFilePaths, fileName);
    await fs.remove(filePath);
  }

  private async getStorageAccountClient(subscriptionId: string, resourceGroup: string): Promise<StorageAccountClient> {
    const location = Constants.availableBlockchainDataManagerLocations[0];
    const subscriptionItem = await this.getSubscriptionItem(subscriptionId);
    const resourceGroupItem = new ResourceGroupItem(resourceGroup, location);

    return new StorageAccountClient(
      subscriptionItem.session.credentials,
      subscriptionItem.subscriptionId,
      resourceGroupItem.label,
      resourceGroupItem.description,
      Constants.azureResourceExplorer.requestBaseUri,
      {
        acceptLanguage: Constants.azureResourceExplorer.requestAcceptLanguage,
        filters: [],
        generateClientRequestId: false,
        longRunningOperationRetryTimeout: 30,
        noRetryPolicy: false,
        requestOptions: {
          customHeaders: {},
        },
        rpRegistrationRetryTimeout: 30,
      },
    );
  }
}
