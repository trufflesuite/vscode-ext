// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { HttpMethods, IncomingMessage, ServiceClientCredentials, ServiceError, WebResource } from 'ms-rest';
import { AzureServiceClient, AzureServiceClientOptions, UserTokenCredentials } from 'ms-rest-azure';
import * as uuid from 'uuid';
import { env, Uri, window } from 'vscode';
import { Constants } from '../Constants';
import { Output } from '../Output';
import { ConsortiumResource } from './Operations/ConsortiumResource';
import { MemberResource } from './Operations/MemberResource';
import { TransactionNodeResource } from './Operations/TransactionNodeResource';

export class AzureBlockchainServiceClient extends AzureServiceClient {
  public memberResource: MemberResource;
  public transactionNodeResource: TransactionNodeResource;
  public consortiumResource: ConsortiumResource;

  constructor(
    credentials: ServiceClientCredentials | UserTokenCredentials,
    private readonly subscriptionId: string,
    private readonly resourceGroup: string,
    private readonly baseUri: string,
    private readonly apiVersion: string,
    private readonly options: AzureServiceClientOptions,
  ) {
    super(credentials, options);

    if (credentials === null || credentials === undefined) {
      throw new Error('\'credentials\' cannot be null.');
    }
    if (subscriptionId === null || subscriptionId === undefined) {
      throw new Error('\'subscriptionId\' cannot be null.');
    }

    const packageInfo = this.getPackageJsonInfo(__dirname);
    this.addUserAgentInfo(`${packageInfo.name}/${packageInfo.version}`);

    this.memberResource = new MemberResource(this);
    this.transactionNodeResource = new TransactionNodeResource(this);
    this.consortiumResource = new ConsortiumResource(this);
  }

  public async createConsortium(memberName: string, body: string): Promise<void> {
    const urlDetailsOfConsortium = `subscriptions/${this.subscriptionId}/resourceGroups/${this.resourceGroup}/` +
    `providers/Microsoft.Blockchain/blockchainMembers/${memberName}`;
    const url = `${this.baseUri}/${urlDetailsOfConsortium}?api-version=${this.apiVersion}`;
    const httpRequest = this._getHttpRequest(url, 'PUT', body);

    // @ts-ignore
    await this.pipeline(httpRequest, (err: ServiceError) => {
      if (err) {
        Output.outputLine(Constants.outputChannel.azureBlockchainServiceClient, err.message);
      }

      env.openExternal(Uri.parse(`${Constants.azureResourceExplorer.portalBasUri}/resource/${urlDetailsOfConsortium}`));
    });
  }

  public getMembers(callback: (error: Error | null, result?: any) => void)
    : Promise<void> {

    const url = `${this.baseUri}/subscriptions/${this.subscriptionId}/resourceGroups/${this.resourceGroup}` +
      `/providers/Microsoft.Blockchain/blockchainMembers?api-version=${this.apiVersion}`;

    const httpRequest = this._getHttpRequest(url, 'GET');

    return this._sendRequestToAzure(httpRequest, callback);
  }

  public getTransactionNodes(
    memberName: string,
    callback: (error: Error | null, result?: any) => void,
  ): Promise<void> {

    const url = `${this.baseUri}/subscriptions/${this.subscriptionId}/resourceGroups/${this.resourceGroup}/` +
      `providers/Microsoft.Blockchain/blockchainMembers/${memberName}/transactionNodes?api-version=${this.apiVersion}`;

    const httpRequest = this._getHttpRequest(url, 'GET');

    return this._sendRequestToAzure(httpRequest, callback);
  }

  public getMemberAccessKeys(
    memberName: string,
    callback: (error: Error | null, result?: any) => void,
  ): Promise<void> {
    const url = `${this.baseUri}/subscriptions/${this.subscriptionId}/resourceGroups/${this.resourceGroup}/` +
      `providers/Microsoft.Blockchain/blockchainMembers/${memberName}/listApikeys?api-version=${this.apiVersion}`;

    const httpRequest = this._getHttpRequest(url, 'POST');

    return this._sendRequestToAzure(httpRequest, callback);
  }

  private async _sendRequestToAzure(
    httpRequest: WebResource,
    callback: (error: Error | null, result?: any) => void,
  ): Promise<void> {
    // @ts-ignore
    return this.pipeline(httpRequest, (err: ServiceError, response: IncomingMessage, responseBody: string) => {
      if (err) {
        window.showErrorMessage(err.message);
        return callback(err);
      }
      const statusCode = response.statusCode;
      if (statusCode !== 200) {
        const error = new Error(responseBody);
        return callback(error);
      }
      // Deserialize Response
      try {
        const parsedResult = JSON.parse(responseBody);
        return callback(null, parsedResult);
      } catch (error) {
        return callback(new Error(`Error ${error} occurred in deserialize the responseBody - ${responseBody}`));
      }
    });
  }

  private _getHttpRequest(url: string, method: HttpMethods, body?: string): WebResource {
    const httpRequest = new WebResource();

    httpRequest.method = method;
    httpRequest.url = url;
    httpRequest.headers = {};

    httpRequest.headers['Content-Type'] = 'application/json';
    if (this.options.generateClientRequestId) {
      httpRequest.headers['x-ms-client-request-id'] = uuid.v4();
    }
    if (this.options.acceptLanguage) {
      httpRequest.headers['accept-language'] = this.options.acceptLanguage;
    }

    httpRequest.body = body;

    return httpRequest;
  }
}
