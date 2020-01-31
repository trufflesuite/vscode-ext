// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as assert from 'assert';
import { ServiceClientCredentials } from 'ms-rest';
import * as msrestazure from 'ms-rest-azure';
import * as sinon from 'sinon';
import * as uuid from 'uuid';
import * as vscode from 'vscode';
import { AzureBlockchainServiceClient } from '../src/ARMBlockchain/AzureBlockchainServiceClient';
import { Constants } from '../src/Constants';
import { vscodeEnvironment } from '../src/helpers';
import { Output } from '../src/Output';

describe('Unit tests for AzureBlockchainServiceClient', () => {
  let credentials: ServiceClientCredentials;
  let subscriptionId: string;
  let resourceGroup: string;
  let baseUri: string;
  let memberName: string;
  let bdmName: string;
  let transactionNode: string;
  const azureBlockchainServiceClient = require('../src/ARMBlockchain/AzureBlockchainServiceClient');
  const defaultResponseBody = '{ "message": "default response body" }';
  let callbackFunction: (error: Error | null, result?: any) => void;
  let callbackFunctionSpy: any;
  let options: msrestazure.AzureServiceClientOptions;
  let body: string;
  let resultElement: string;

  before(() => {
    credentials = {
      signRequest: () => undefined,
    };
    callbackFunction = (_error: Error | null, _result?: any) => undefined;
    options = {};
    body = uuid.v4();
    resultElement = uuid.v4();
  });

  beforeEach(() => {
    subscriptionId = uuid.v4();
    resourceGroup = uuid.v4();
    baseUri = uuid.v4();
    memberName = uuid.v4();
    bdmName = uuid.v4();
    transactionNode = uuid.v4();
    sinon.stub(azureBlockchainServiceClient.__proto__, 'constructor');

    callbackFunctionSpy = sinon.spy(callbackFunction);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('constructor', () => {
    it('AzureBlockchainServiceClient was created.', async () => {
      // Arrange, Act
      const serviceClient = new azureBlockchainServiceClient.AzureBlockchainServiceClient(
        credentials,
        subscriptionId,
        resourceGroup,
        baseUri,
        options,
      );

      // Assert
      assert.notStrictEqual(serviceClient, undefined, 'serviceClient should not be undefined');
      assert.strictEqual(
        serviceClient.constructor.name,
        AzureBlockchainServiceClient.name,
        `serviceClient name should be equal to ${AzureBlockchainServiceClient.name}`);
    });

    describe('invalid subscriptionId', () => {
      const invalidSubscriptions = [String.Empty, null, undefined, ''];
      invalidSubscriptions.forEach(async (subscription) => {
        it(`AzureBlockchainServiceClient constructor throws error when subscriptionId is ${subscription}.`,
        async () => {
          // Arrange
          let serviceClient;

          // Act
          const action = () => {
            serviceClient = new azureBlockchainServiceClient.AzureBlockchainServiceClient(
              credentials,
              subscription,
              resourceGroup,
              baseUri,
              options,
            );
          };

          // Assert
          assert.throws(
            action,
            Error,
            Constants.errorMessageStrings.VariableShouldBeDefined('subscriptionId'));
          assert.strictEqual(serviceClient, undefined, 'serviceClient should be undefined');
        });
      });
    });

    describe('invalid credentials', () => {
      const invalidCredentials = [null, undefined];
      invalidCredentials.forEach(async (credential) => {
        it(`AzureBlockchainServiceClient constructor throws error when credentials is ${credential}.`,
        async () => {
          // Arrange
          let serviceClient;

          // Act
          const action = () => {
            serviceClient = new azureBlockchainServiceClient.AzureBlockchainServiceClient(
              credential,
              subscriptionId,
              resourceGroup,
              baseUri,
              options,
            );
          };

          // Assert
          assert.throws(
            action,
            Error,
            Constants.errorMessageStrings.VariableShouldBeDefined('credentials'));
          assert.strictEqual(serviceClient, undefined, 'serviceClient should be undefined');
        });
      });
    });
  });

  describe('Public methods.', () => {
    let serviceClient: AzureBlockchainServiceClient;
    let pipelineMock: sinon.SinonStub<any[], any> | sinon.SinonStub<unknown[], {}>;
    let sendRequestToAzureMock: sinon.SinonStub<any[], any>;
    let outputMock: sinon.SinonMock;
    let outputLineMock: sinon.SinonExpectation;
    let openExternalSpy: sinon.SinonSpy<[vscode.Uri], Thenable<boolean>>;
    let windowMock: sinon.SinonMock;
    let showErrorMessageMock: sinon.SinonExpectation;

    beforeEach(() => {
      serviceClient = new azureBlockchainServiceClient.AzureBlockchainServiceClient(
        credentials,
        subscriptionId,
        resourceGroup,
        baseUri,
        options,
      );
      // @ts-ignore
      pipelineMock = sinon.stub(serviceClient, 'pipeline');
      sendRequestToAzureMock = sinon.stub(serviceClient, 'sendRequestToAzure' as any);
      openExternalSpy = sinon.stub(vscodeEnvironment, 'openExternal');
      outputMock = sinon.mock(Output);
      outputLineMock = outputMock.expects('outputLine');
      windowMock = sinon.mock(vscode.window);
      showErrorMessageMock = windowMock.expects('showErrorMessage');
    });

    afterEach(() => {
      sendRequestToAzureMock.restore();
      pipelineMock.restore();
      openExternalSpy.restore();
      outputMock.restore();
      windowMock.restore();
    });

    it('createConsortium shows error when request failed.', async () => {
      // Arrange
      const response = sinon.stub();
      const error = { message: uuid.v4() };

      pipelineMock.callsFake((...args: any[]): {} => {
        return args[1](error, response, defaultResponseBody);
      });

      // Act
      await serviceClient.createConsortium(memberName, body);

      // Assert
      assert.strictEqual(pipelineMock.calledOnce, true, 'pipeline should called once');
      assert.strictEqual(
        outputLineMock.calledOnceWithExactly(Constants.outputChannel.azureBlockchainServiceClient, error.message),
        true,
        'outputLine should called once with correct arguments');
      assert.strictEqual(openExternalSpy.notCalled, true, 'openExternal should not called');
    });

    describe('createConsortium shows error when response is not success.', () => {
      const statusCodes = [103, 300, 400, 498];
      statusCodes.forEach(async (statusCode) => {
        it(`response status code is ${statusCode}.`, async () => {
          // Arrange
          const response = {statusCode, statusMessage: uuid.v4()};
          let callbackSpy: any;
          pipelineMock.callsFake((...args: any[]): {} => {
            callbackSpy = sinon.spy(args[1]);
            return callbackSpy(null, response, defaultResponseBody);
          });

          // Act
          await serviceClient.createConsortium(memberName, body);

          // Assert
          assert.strictEqual(pipelineMock.calledOnce, true, 'pipeline should called once');
          assert.strictEqual(callbackSpy.args[0][0], null, 'callback function should called with correct arguments');
          assert.strictEqual(
            outputLineMock.calledOnceWithExactly(
              Constants.outputChannel.azureBlockchainServiceClient,
              `${response.statusMessage}(${response.statusCode}): ${defaultResponseBody}`),
            true,
            'outputLine should called once with correct arguments');
          assert.strictEqual(openExternalSpy.notCalled, true, 'openExternal should not called');
          assert.strictEqual(
            showErrorMessageMock.calledOnceWithExactly(
              Constants.executeCommandMessage.failedToRunCommand('CreateConsortium')),
            true,
            'showErrorMessage should called once with correct arguments');
        });
      });
    });

    describe('createConsortium does not show error when response is success.', () => {
      const statusCodes = [200, 207, 226];
      statusCodes.forEach(async (statusCode) => {
        it(`response status code is ${statusCode}.`, async () => {
          // Arrange
          const response = {statusCode, statusMessage: uuid.v4()};
          let callbackSpy: any;
          pipelineMock.callsFake((...args: any[]): {} => {
            callbackSpy = sinon.spy(args[1]);
            return callbackSpy(null, response, defaultResponseBody);
          });

          // Act
          await serviceClient.createConsortium(memberName, body);

          // Assert
          assert.strictEqual(pipelineMock.calledOnce, true, 'pipeline should called once');
          assert.strictEqual(callbackSpy.args[0][0], null, 'callback function should called with correct arguments');
          assert.strictEqual(outputLineMock.notCalled, true, 'outputLine should not called');
          assert.strictEqual(showErrorMessageMock.notCalled, true, 'showErrorMessage should not called');
          assert.strictEqual(openExternalSpy.calledOnce, true, 'openExternal should called once');
          assert.strictEqual(
            openExternalSpy.args[0][0] instanceof vscode.Uri,
            true,
            'openExternal should called with correct arguments');
        });
      });
    });

    const listOfMethod = [
      { callback: async () => await serviceClient.getMembers('consortiumName', callbackFunctionSpy),
        methodName: 'getMembers' },
      { callback: async () => await serviceClient.getConsortia(callbackFunctionSpy),
        methodName: 'getConsortia' },
      { callback: async () => await serviceClient.getTransactionNodes(memberName, callbackFunctionSpy),
        methodName: 'getTransactionNodes' },
      { callback: async () =>
          await serviceClient.getTransactionNodeAccessKeys(memberName, transactionNode, callbackFunctionSpy),
        methodName: 'getTransactionNodeAccessKeys' },
      { callback: async () => await serviceClient.getSkus(callbackFunctionSpy),
        methodName: 'getSkus' },
      { callback: async () => await serviceClient.getBlockchainDataManagers(callbackFunctionSpy),
        methodName: 'getBlockchainDataManagers' },
      { callback: async () => await serviceClient.getBlockchainDataManagerApplications(bdmName, callbackFunctionSpy),
        methodName: 'getBlockchainDataManagerpplications' },
    ];

    listOfMethod.forEach((method) => {
      it(`${method.methodName} returns error.`, async () => {
        // Arrange
        const error = new Error(uuid.v4());
        sendRequestToAzureMock.callsFake((...args: any[]): {} => {
          return args[1](error);
        });

        // Act
        await method.callback();

        // Assert
        assert.strictEqual(sendRequestToAzureMock.calledOnce, true, 'sendRequestToAzure should called once');
        assert.strictEqual(
          callbackFunctionSpy.calledOnceWithExactly(error),
          true,
          'callbackFunction should called once with correct arguments');
      });

      it(`${method.methodName} does not return error.`, async () => {
        // Arrange
        sendRequestToAzureMock.callsFake((...args: any[]): {} => {
          return args[1](null, resultElement);
        });

        // Act
        await method.callback();

        // Assert
        assert.strictEqual(sendRequestToAzureMock.calledOnce, true, 'sendRequestToAzure should called once');
        assert.strictEqual(
          callbackFunctionSpy.calledOnceWithExactly(null, resultElement),
          true,
          'callbackFunction should called once with correct arguments');
      });
    });
  });
});
