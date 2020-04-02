// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ServiceClientCredentials } from 'ms-rest';
import { AzureServiceClientOptions, UserTokenCredentials } from 'ms-rest-azure';
import { Constants } from '../Constants';
import { Telemetry } from '../TelemetryClient';
import { BaseClient } from './BaseClient';
import { BlockchainDataManagerResource } from './Operations/BlockchainDataManagerResource';
import { ConsortiumResource } from './Operations/ConsortiumResource';
import { MemberResource } from './Operations/MemberResource';
import { SkuResource } from './Operations/SkuResources';
import { TransactionNodeResource } from './Operations/TransactionNodeResource';

const { preview20180601, preview20190601 } = Constants.azureApiVersions;

export class AzureBlockchainServiceClient extends BaseClient {
  public memberResource: MemberResource;
  public transactionNodeResource: TransactionNodeResource;
  public consortiumResource: ConsortiumResource;
  public skuResource: SkuResource;
  public bdmResource: BlockchainDataManagerResource;

  constructor(
    credentials: ServiceClientCredentials | UserTokenCredentials,
    subscriptionId: string,
    resourceGroup: string,
    location: string,
    baseUri: string,
    options: AzureServiceClientOptions,
  ) {
    super(credentials, subscriptionId, resourceGroup, location, baseUri, options);

    this.memberResource = new MemberResource(this);
    this.transactionNodeResource = new TransactionNodeResource(this);
    this.consortiumResource = new ConsortiumResource(this);
    this.skuResource = new SkuResource(this);
    this.bdmResource = new BlockchainDataManagerResource(this);
  }

  public createConsortium(
    memberName: string,
    body: string,
    callback: (error: Error | null, result?: any) => void,
  ): Promise<void> {
    const url = this.getUrl(memberName, preview20180601, true, true);

    const httpRequest = this.getHttpRequest(url, 'PUT', body);

    return this.sendRequestToAzure(httpRequest, (error) => {
      if (error) {
        Telemetry.sendEvent('AzureBlockchainServiceClient.createConsortium.createdFailed');
        callback(error);
      } else {
        Telemetry.sendEvent('AzureBlockchainServiceClient.createConsortium.createdSuccessfully');
        callback(null);
      }
    });
  }

  public startBlockchainDataManager(bdmName: string, callback: (error: Error | null, result?: any) => void)
  : Promise<void> {
    const url = this.getUrl(`watchers/${bdmName}/start`, preview20190601, true, false);

    const httpRequest = this.getHttpRequest(url, 'POST');

    return this.sendRequestToAzure(httpRequest, (error) => {
      if (error) {
        Telemetry.sendEvent('AzureBlockchainServiceClient.startBlockchainDataManager.createdFailed');
        callback(error);
      } else {
        Telemetry.sendEvent('AzureBlockchainServiceClient.startBlockchainDataManager.runSuccessfully');
        callback(null);
      }
    });
  }

  public createBlockchainDataManager(
    bdmName: string,
    body: string,
    callback: (error: Error | null, result?: any) => void)
  : Promise<void> {
    const url = this.getUrl(`watchers/${bdmName}`, preview20190601, true, false);

    const httpRequest = this.getHttpRequest(url, 'PUT', body);

    return this.sendRequestToAzure(httpRequest, callback);
  }

  public createBlockchainDataManagerInput(
    bdmName: string,
    transactionNodeName: string,
    body: string,
    callback: (error: Error | null, result?: any) => void)
  : Promise<void> {
    const url = this.getUrl(
      `watchers/${bdmName}/inputs/${bdmName}${transactionNodeName}`, preview20190601, true, false);

    const httpRequest = this.getHttpRequest(url, 'PUT', body);

    return this.sendRequestToAzure(httpRequest, callback);
  }

  public createBlockchainDataManagerOutput(
    bdmName: string,
    connectionName: string,
    body: string,
    callback: (error: Error | null, result?: any) => void)
  : Promise<void> {
    const url = this.getUrl(`watchers/${bdmName}/outputs/${connectionName}`, preview20190601, true, false);

    const httpRequest = this.getHttpRequest(url, 'PUT', body);

    return this.sendRequestToAzure(httpRequest, callback);
  }

  public createBlockchainDataManagerApplication(
    bdmName: string,
    applicationName: string,
    body: string,
    callback: (error: Error | null, result?: any) => void)
  : Promise<void> {
    const url = this.getUrl(`watchers/${bdmName}/artifacts/${applicationName}`, preview20190601, true, false);

    const httpRequest = this.getHttpRequest(url, 'PUT', body);

    return this.sendRequestToAzure(httpRequest, callback);
  }

  public removeBlockchainDataManager(bdmName: string, callback: (error: Error | null, result?: any) => void)
  : Promise<void> {
    const url = this.getUrl(`watchers/${bdmName}`, preview20190601, true, false);

    const httpRequest = this.getHttpRequest(url, 'DELETE');

    return this.sendRequestToAzure(httpRequest, callback);
  }

  public getBlockchainDataManagers(callback: (error: Error | null, result?: any) => void): Promise<void> {
    const url = this.getUrl('watchers', preview20190601, true, false);

    const httpRequest = this.getHttpRequest(url, 'GET');
    return this.sendRequestToAzure(httpRequest, callback);
  }

  public getBlockchainDataManagerApplications(bdmName: string, callback: (error: Error | null, result?: any) => void)
  : Promise<void> {
    const url = this.getUrl(`watchers/${bdmName}/artifacts`, preview20190601, true, false);

    const httpRequest = this.getHttpRequest(url, 'GET');

    return this.sendRequestToAzure(httpRequest, callback);
  }

  public getBlockchainDataManagerApplication(
    bdmName: string,
    applicationName: string,
    callback: (error: Error | null, result?: any) => void)
  : Promise<void> {
    const url = this.getUrl(`watchers/${bdmName}/artifacts/${applicationName}`, preview20190601, true, false);

    const httpRequest = this.getHttpRequest(url, 'GET');

    return this.sendRequestToAzure(httpRequest, callback);
  }

  public deleteBlockchainDataManagerApplication(
    bdmName: string,
    applicationName: string,
    callback: (error: Error | null, result?: any) => void)
  : Promise<void> {
    const url =
      this.getUrl(`watchers/${bdmName}/artifacts/${applicationName}`, preview20190601, true, false);

    const httpRequest = this.getHttpRequest(url, 'DELETE');
    return this.sendRequestToAzure(httpRequest, callback);
  }

  public getBlockchainDataManagerInputs(bdmName: string, callback: (error: Error | null, result?: any) => void)
  : Promise<void> {
    const url = this.getUrl(`watchers/${bdmName}/inputs`, preview20190601, true, false);

    const httpRequest = this.getHttpRequest(url, 'GET');
    return this.sendRequestToAzure(httpRequest, callback);
  }

  public getBlockchainDataManagerOutputs(bdmName: string, callback: (error: Error | null, result?: any) => void)
  : Promise<void> {
    const url = this.getUrl(`watchers/${bdmName}/outputs`, preview20190601, true, false);

    const httpRequest = this.getHttpRequest(url, 'GET');
    return this.sendRequestToAzure(httpRequest, callback);
  }

  public getMembers(memberName: string, callback: (error: Error | null, result?: any) => void): Promise<void> {
    const url = this.getUrl(`${memberName}/ConsortiumMembers`, preview20180601, true, true);

    const httpRequest = this.getHttpRequest(url, 'GET');

    return this.sendRequestToAzure(httpRequest, callback);
  }

  public getConsortia(callback: (error: Error | null, result?: any) => void): Promise<void> {
    const url = this.getUrl('', preview20180601, true, true);

    const httpRequest = this.getHttpRequest(url, 'GET');

    return this.sendRequestToAzure(httpRequest, callback);
  }

  public getTransactionNodes(memberName: string, callback: (error: Error | null, result?: any) => void): Promise<void> {
    const url = this.getUrl(`${memberName}/transactionNodes`, preview20180601, true, true);

    const httpRequest = this.getHttpRequest(url, 'GET');

    return this.sendRequestToAzure(httpRequest, callback);
  }

  public getTransactionNode(
    memberName: string,
    transactionNodeName: string,
    callback: (error: Error | null, result?: any) => void)
  : Promise<void> {
    const url = this.getUrl(`${memberName}/transactionNodes/${transactionNodeName}`, preview20180601, true, true);

    const httpRequest = this.getHttpRequest(url, 'GET');

    return this.sendRequestToAzure(httpRequest, callback);
  }

  public createTransactionNode(
    memberName: string,
    transactionNodeName: string,
    body: string,
    callback: (error: Error | null, result?: any) => void)
  : Promise<void> {
    const url = this.getUrl(`${memberName}/transactionNodes/${transactionNodeName}`, preview20180601, true, true);

    const httpRequest = this.getHttpRequest(url, 'PUT', body);

    return this.sendRequestToAzure(httpRequest, callback);
  }

  public getTransactionNodeAccessKeys(
    memberName: string,
    nodeName: string,
    callback: (error: Error | null, result?: any) => void,
  ): Promise<void> {
    const mainPartOfUrl = (memberName === nodeName)
      ? `${memberName}/listApikeys`
      : `${memberName}/transactionNodes/${nodeName}/listApikeys`;

    const url = this.getUrl(mainPartOfUrl, preview20180601, true, true);

    const httpRequest = this.getHttpRequest(url, 'POST');

    return this.sendRequestToAzure(httpRequest, callback);
  }

  public getSkus(callback: (error: Error | null, result?: any) => void): Promise<void> {
    const url = this.getUrl('skus', preview20180601);

    const httpRequest = this.getHttpRequest(url, 'GET');

    return this.sendRequestToAzure(httpRequest, callback);
  }

  public checkExistence(name: string, type: string): Promise<{
    message: string | null,
    nameAvailable: boolean,
    reason: string,
  }> {
    const url = this.getUrl(`locations/${this.location}/checkNameAvailability`, preview20180601);

    const request = this.getHttpRequest(
      url,
      'POST',
      JSON.stringify({
        name,
        type,
      }),
    );

    return new Promise((resolve, reject) => {
      this.sendRequestToAzure(request, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  private getUrl(
    mainPartOfUrl: string,
    apiVersion: string,
    useResourceGroup: boolean = false,
    useBlockchainMembers: boolean = false)
  : string {
    const resourceGroup = useResourceGroup ? `resourceGroups/${this.resourceGroup}/` : '';
    const blockchainMember = useBlockchainMembers ? 'blockchainMembers/' : '';

    return `${this.baseUri}/subscriptions/${this.subscriptionId}/${resourceGroup}` +
      `providers/${Constants.azureProviders.blockchain}/${blockchainMember}${mainPartOfUrl}?api-version=${apiVersion}`;
  }
}
