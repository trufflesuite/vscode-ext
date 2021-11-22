// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import { HttpMethods, IncomingMessage, ServiceClientCredentials, WebResource } from "ms-rest";
import { AzureServiceClient, AzureServiceClientOptions, UserTokenCredentials } from "ms-rest-azure";
import * as uuid from "uuid";
import { window } from "vscode";
import { Constants } from "../Constants";
import { Telemetry } from "../TelemetryClient";

export class BaseClient extends AzureServiceClient {
  constructor(
    credentials: ServiceClientCredentials | UserTokenCredentials,
    public readonly subscriptionId: string,
    public readonly resourceGroup: string,
    public readonly location: string,
    public readonly baseUri: string,
    public readonly options: AzureServiceClientOptions
  ) {
    super(credentials, options);

    if (!credentials) {
      const error = new Error(Constants.errorMessageStrings.VariableShouldBeDefined("Credentials"));
      Telemetry.sendException(error);
      throw error;
    }
    if (!subscriptionId) {
      const error = new Error(Constants.errorMessageStrings.VariableShouldBeDefined("SubscriptionId"));
      Telemetry.sendException(error);
      throw error;
    }

    const packageInfo = this.getPackageJsonInfo(__dirname);
    this.addUserAgentInfo(`${packageInfo.name}/${packageInfo.version}`);
  }

  public async sendRequestToAzure(
    httpRequest: WebResource,
    callback: (error: Error | null, result?: any) => void
  ): Promise<void> {
    // @ts-ignore
    return this.pipeline(httpRequest, (err: RestError | null, response: IncomingMessage, responseBody: string) => {
      if (err) {
        Telemetry.sendException(new Error("BaseClient.sendRequestToAzure.pipeline.error"));
        window.showErrorMessage(err.message);
        return callback(err);
      } else if (response.statusCode! < 200 || response.statusCode! > 299) {
        const error = new Error(responseBody);
        Telemetry.sendException(new Error("BaseClient.sendRequestToAzure.pipeline.statusCodeNotSuccess"));
        return callback(error);
      } else {
        // Deserialize Response
        try {
          const parsedResult = responseBody ? JSON.parse(responseBody) : null;
          return callback(null, parsedResult);
        } catch (error) {
          Telemetry.sendException(new Error("Unexpected token in JSON at position 1"));
          return callback(new Error(`Error ${error.message} occurred in deserialize the responseBody`));
        }
      }
    });
  }

  public getHttpRequest(url: string, method: HttpMethods, body?: string): WebResource {
    const httpRequest = new WebResource();

    httpRequest.method = method;
    httpRequest.url = url;
    httpRequest.headers = {};

    httpRequest.headers["Content-Type"] = Constants.azureResourceExplorer.contentType;
    if (this.options && this.options.generateClientRequestId) {
      httpRequest.headers["x-ms-client-request-id"] = uuid.v4();
    }
    if (this.options && this.options.acceptLanguage) {
      httpRequest.headers["accept-language"] = this.options.acceptLanguage;
    }

    httpRequest.body = body;

    return httpRequest;
  }
}
