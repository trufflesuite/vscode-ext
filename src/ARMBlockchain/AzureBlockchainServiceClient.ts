// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { HttpMethods, IncomingMessage, ServiceClientCredentials, ServiceError, WebResource } from 'ms-rest';
import { AzureServiceClient, AzureServiceClientOptions, UserTokenCredentials } from 'ms-rest-azure';
import * as uuid from 'uuid';
import { Uri, window } from 'vscode';
import { Constants } from '../Constants';
import { vscodeEnvironment } from '../helpers';
import { Output } from '../Output';
import { Telemetry } from '../TelemetryClient';
import { ConsortiumResource } from './Operations/ConsortiumResource';
import { MemberResource } from './Operations/MemberResource';
import { SkuResource } from './Operations/SkuResources';
import { TransactionNodeResource } from './Operations/TransactionNodeResource';

export class AzureBlockchainServiceClient extends AzureServiceClient {
  public memberResource: MemberResource;
  public transactionNodeResource: TransactionNodeResource;
  public consortiumResource: ConsortiumResource;
  public skuResource: SkuResource;

  constructor(
    credentials: ServiceClientCredentials | UserTokenCredentials,
    public readonly subscriptionId: string,
    public readonly resourceGroup: string,
    public readonly location: string,
    public readonly baseUri: string,
    public readonly apiVersion: string,
    public readonly options: AzureServiceClientOptions,
  ) {
    super(credentials, options);

    if (!credentials) {
      const error = new Error(Constants.errorMessageStrings.VariableShouldBeDefined('Credentials'));
      Telemetry.sendException(error);
      throw error;
    }
    if (!subscriptionId) {
      const error = new Error(Constants.errorMessageStrings.VariableShouldBeDefined('SubscriptionId'));
      Telemetry.sendException(error);
      throw error;
    }

    const packageInfo = this.getPackageJsonInfo(__dirname);
    this.addUserAgentInfo(`${packageInfo.name}/${packageInfo.version}`);

    this.memberResource = new MemberResource(this);
    this.transactionNodeResource = new TransactionNodeResource(this);
    this.consortiumResource = new ConsortiumResource(this);
    this.skuResource = new SkuResource(this);
  }

  public async createConsortium(memberName: string, body: string): Promise<void> {
    const urlDetailsOfConsortium = `subscriptions/${this.subscriptionId}/resourceGroups/${this.resourceGroup}/` +
    `providers/Microsoft.Blockchain/blockchainMembers/${memberName}`;
    const url = `${this.baseUri}/${urlDetailsOfConsortium}?api-version=${this.apiVersion}`;
    const httpRequest = this.getHttpRequest(url, 'PUT', body);

    // @ts-ignore
    await this.pipeline(httpRequest, (err: ServiceError, response: IncomingMessage, responseBody: string) => {
      if (err) {
        Telemetry.sendException(new Error('AzureBlockchainServiceClient.createConsortium.pipeline.error'));
        Output.outputLine(Constants.outputChannel.azureBlockchainServiceClient, err.message);
      } else if (response.statusCode! < 200 || response.statusCode! > 299) {
        Telemetry.sendException(new Error('AzureBlockchainServiceClient.createConsortium.pipeline.invalidStatus'));
        Output.outputLine(
          Constants.outputChannel.azureBlockchainServiceClient,
          `${response.statusMessage}(${response.statusCode}): ${responseBody}`,
        );

        window.showErrorMessage(Constants.executeCommandMessage.failedToRunCommand('CreateConsortium'));
      } else {
        vscodeEnvironment.openExternal(
          Uri.parse(`${Constants.azureResourceExplorer.portalBasUri}/resource/${urlDetailsOfConsortium}`),
        );
      }
    });
  }

  public getMembers(callback: (error: Error | null, result?: any) => void)
    : Promise<void> {

    const url = `${this.baseUri}/subscriptions/${this.subscriptionId}/resourceGroups/${this.resourceGroup}` +
      `/providers/Microsoft.Blockchain/blockchainMembers?api-version=${this.apiVersion}`;

    const httpRequest = this.getHttpRequest(url, 'GET');

    return this.sendRequestToAzure(httpRequest, callback);
  }

  public getTransactionNodes(
    memberName: string,
    callback: (error: Error | null, result?: any) => void,
  ): Promise<void> {

    const url = `${this.baseUri}/subscriptions/${this.subscriptionId}/resourceGroups/${this.resourceGroup}/` +
      `providers/Microsoft.Blockchain/blockchainMembers/${memberName}/transactionNodes?api-version=${this.apiVersion}`;

    const httpRequest = this.getHttpRequest(url, 'GET');

    return this.sendRequestToAzure(httpRequest, callback);
  }

  public getMemberAccessKeys(
    memberName: string,
    callback: (error: Error | null, result?: any) => void,
  ): Promise<void> {
    const url = `${this.baseUri}/subscriptions/${this.subscriptionId}/resourceGroups/${this.resourceGroup}/` +
      `providers/Microsoft.Blockchain/blockchainMembers/${memberName}/listApikeys?api-version=${this.apiVersion}`;

    const httpRequest = this.getHttpRequest(url, 'POST');

    return this.sendRequestToAzure(httpRequest, callback);
  }

  public getSkus(callback: (error: Error | null, result?: any) => void,
  ): Promise<void> {
    const url = `${this.baseUri}/subscriptions/${this.subscriptionId}` +
      `/providers/Microsoft.Blockchain/skus?api-version=${this.apiVersion}`;

    const httpRequest = this.getHttpRequest(url, 'GET');

    return this.sendRequestToAzure(httpRequest, callback);
  }

  public async sendRequestToAzure(
    httpRequest: WebResource,
    callback: (error: Error | null, result?: any) => void,
  ): Promise<void> {
    // @ts-ignore
    return this.pipeline(httpRequest, (err: ServiceError | null, response: IncomingMessage, responseBody: string) => {
      if (err) {
        Telemetry.sendException(new Error('AzureBlockchainServiceClient.sendRequestToAzure.pipeline.error'));
        window.showErrorMessage(err.message);
        return callback(err);
      }

      const statusCode = response.statusCode;
      if (statusCode !== 200) {
        const error = new Error(responseBody);
        Telemetry.sendException(
          new Error('AzureBlockchainServiceClient.sendRequestToAzure.pipeline.statusCodeNotSuccess'));
        return callback(error);
      }

      // Deserialize Response
      try {
        const parsedResult = JSON.parse(responseBody);
        return callback(null, parsedResult);
      } catch (error) {
        Telemetry.sendException(new Error('Unexpected token in JSON at position 1'));
        return callback(new Error(`Error ${error.message} occurred in deserialize the responseBody`));
      }
    });
  }

  public getHttpRequest(url: string, method: HttpMethods, body?: string): WebResource {
    const httpRequest = new WebResource();

    httpRequest.method = method;
    httpRequest.url = url;
    httpRequest.headers = {};

    httpRequest.headers['Content-Type'] = Constants.azureResourceExplorer.contentType;
    if (this.options && this.options.generateClientRequestId) {
      httpRequest.headers['x-ms-client-request-id'] = uuid.v4();
    }
    if (this.options && this.options.acceptLanguage) {
      httpRequest.headers['accept-language'] = this.options.acceptLanguage;
    }

    httpRequest.body = body;

    return httpRequest;
  }

  public async checkExistence(name: string, type: string): Promise<{
    message: string | null,
    nameAvailable: boolean,
    reason: string,
  }> {
    const requestUrl = `${this.baseUri}/subscriptions/${this.subscriptionId}` +
      `/providers/Microsoft.Blockchain/locations/${this.location}` +
      `/checkNameAvailability?api-version=${this.apiVersion}`;

    const request = this.getHttpRequest(
      requestUrl,
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
}
