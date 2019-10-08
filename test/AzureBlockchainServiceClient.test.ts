// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as assert from 'assert';
import { ServiceClientCredentials } from 'ms-rest';
import * as msrestazure from 'ms-rest-azure';
import * as sinon from 'sinon';
import * as uuid from 'uuid';
import * as vscode from 'vscode';
import { AzureBlockchainServiceClient } from '../src/ARMBlockchain';
import { Constants } from '../src/Constants';
import { vscodeEnvironment } from '../src/helpers';
import { Output } from '../src/Output';

describe('AzureBlockchainServiceClient', () => {
  let credentials: ServiceClientCredentials;
  let subscriptionId: string;
  let resourceGroup: string;
  let baseUri: string;
  let apiVersion: string;
  let memberName: string;
  let transactionNode: string;
  const azureBlockchainServiceClient = require('../src/ARMBlockchain/AzureBlockchainServiceClient');
  const defaultResponseBody = '{ "message": "default response body" }';
  let callbackFunction: (error: Error | null, result?: any) => void;

  before(() => {
    credentials = {
      signRequest: () => undefined,
    };
    callbackFunction = (_error: Error | null, _result?: any) => undefined;
  });

  beforeEach(() => {
    subscriptionId = uuid.v4();
    resourceGroup = uuid.v4();
    baseUri = uuid.v4();
    apiVersion = uuid.v4();
    memberName = uuid.v4();
    transactionNode = uuid.v4();
    sinon.stub(azureBlockchainServiceClient.__proto__, 'constructor');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Unit tests', () => {
    let options: msrestazure.AzureServiceClientOptions;
    let body: string;
    let resultElement: string;

    before(() => {
      options = {};
      body = uuid.v4();
      resultElement = uuid.v4();
    });

    describe('constructor', () => {
      it('AzureBlockchainServiceClient was created.', async () => {
        // Arrange, Act
        const serviceClient = new azureBlockchainServiceClient.AzureBlockchainServiceClient(
          credentials,
          subscriptionId,
          resourceGroup,
          baseUri,
          apiVersion,
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
                apiVersion,
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
                apiVersion,
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
          apiVersion,
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

      it('createProject shows error when request failed.', async () => {
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

      describe('createProject shows error when response is not success.', () => {
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

      describe('createProject does not show error when response is success.', () => {
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

      it('getMembers returns error.', async () => {
        // Arrange
        const callbackFunctionSpy = sinon.spy(callbackFunction);
        const error = new Error(uuid.v4());
        sendRequestToAzureMock.callsFake((...args: any[]): {} => {
          return args[1](error);
        });

        // Act
        await serviceClient.getMembers(callbackFunctionSpy);

        // Assert
        assert.strictEqual(sendRequestToAzureMock.calledOnce, true, 'sendRequestToAzure should called once');
        assert.strictEqual(
          callbackFunctionSpy.calledOnceWithExactly(error),
          true,
          'callbackFunction should called once with correct arguments');
      });

      it('getMembers does not return error.', async () => {
        // Arrange
        const callbackFunctionSpy = sinon.spy(callbackFunction);
        sendRequestToAzureMock.callsFake((...args: any[]): {} => {
          return args[1](null, resultElement);
        });

        // Act
        await serviceClient.getMembers(callbackFunctionSpy);

        // Assert
        assert.strictEqual(sendRequestToAzureMock.calledOnce, true, 'sendRequestToAzure should called once');
        assert.strictEqual(
          callbackFunctionSpy.calledOnceWithExactly(null, resultElement),
          true,
          'callbackFunction should called once with correct arguments');
      });

      it('getTransactionNodes returns error.', async () => {
        // Arrange
        const callbackFunctionSpy = sinon.spy(callbackFunction);
        const error = new Error(uuid.v4());
        sendRequestToAzureMock.callsFake((...args: any[]): {} => {
          return args[1](error);
        });

        // Act
        await serviceClient.getTransactionNodes(memberName, callbackFunctionSpy);

        // Assert
        assert.strictEqual(sendRequestToAzureMock.calledOnce, true, 'sendRequestToAzure should called once');
        assert.strictEqual(
          callbackFunctionSpy.calledOnceWithExactly(error),
          true,
          'callbackFunction should called once with correct arguments');
      });

      it('getTransactionNodes does not return error.', async () => {
        // Arrange
        const callbackFunctionSpy = sinon.spy(callbackFunction);
        sendRequestToAzureMock.callsFake((...args: any[]): {} => {
          return args[1](null, resultElement);
        });

        // Act
        await serviceClient.getTransactionNodes(memberName, callbackFunctionSpy);

        // Assert
        assert.strictEqual(sendRequestToAzureMock.calledOnce, true, 'sendRequestToAzure should called once');
        assert.strictEqual(
          callbackFunctionSpy.calledOnceWithExactly(null, resultElement),
          true,
          'callbackFunction should called once with correct arguments');
      });

      it('getTransactionNodeAccessKeys returns error.', async () => {
        // Arrange
        const callbackFunctionSpy = sinon.spy(callbackFunction);
        const error = new Error(uuid.v4());
        sendRequestToAzureMock.callsFake((...args: any[]): {} => {
          return args[1](error);
        });

        // Act
        await serviceClient.getTransactionNodeAccessKeys(memberName, transactionNode, callbackFunctionSpy);

        // Assert
        assert.strictEqual(sendRequestToAzureMock.calledOnce, true, 'sendRequestToAzure should called once');
        assert.strictEqual(
          callbackFunctionSpy.calledOnceWithExactly(error),
          true,
          'callbackFunction should called once with correct arguments');
      });

      it('getTransactionNodeAccessKeys does not return error.', async () => {
        // Arrange
        const callbackFunctionSpy = sinon.spy(callbackFunction);
        sendRequestToAzureMock.callsFake((...args: any[]): {} => {
          return args[1](null, resultElement);
        });

        // Act
        await serviceClient.getTransactionNodeAccessKeys(memberName, transactionNode, callbackFunctionSpy);

        // Assert
        assert.strictEqual(sendRequestToAzureMock.calledOnce, true, 'sendRequestToAzure should called once');
        assert.strictEqual(
          callbackFunctionSpy.calledOnceWithExactly(null, resultElement),
          true,
          'callbackFunction should called once with correct arguments');
      });

      it('getSkus returns error.', async () => {
        // Arrange
        const callbackFunctionSpy = sinon.spy(callbackFunction);
        const error = new Error(uuid.v4());
        sendRequestToAzureMock.callsFake((...args: any[]): {} => {
          return args[1](error);
        });

        // Act
        await serviceClient.getSkus(callbackFunctionSpy);

        // Assert
        assert.strictEqual(sendRequestToAzureMock.calledOnce, true, 'sendRequestToAzure should called once');
        assert.strictEqual(
          callbackFunctionSpy.calledOnceWithExactly(error),
          true,
          'callbackFunction should called once with correct arguments');
      });

      it('getSkus does not return error.', async () => {
        // Arrange
        const callbackFunctionSpy = sinon.spy(callbackFunction);
        sendRequestToAzureMock.callsFake((...args: any[]): {} => {
          return args[1](null, resultElement);
        });

        // Act
        await serviceClient.getSkus(callbackFunctionSpy);

        // Assert
        assert.strictEqual(sendRequestToAzureMock.calledOnce, true, 'sendRequestToAzure should called once');
        assert.strictEqual(
          callbackFunctionSpy.calledOnceWithExactly(null, resultElement),
          true,
          'callbackFunction should called once with correct arguments');
      });
    });
  });

  describe('Integration tests', () => {
    const incorrectResponseBody = uuid.v4();
    let windowMock: sinon.SinonMock;
    let showErrorMessageMock: sinon.SinonExpectation;
    let pipelineMock: sinon.SinonStub<any[], any> | sinon.SinonStub<unknown[], {}>;
    let serviceClient: AzureBlockchainServiceClient;

    beforeEach(() => {
      windowMock = sinon.mock(vscode.window);
      showErrorMessageMock = windowMock.expects('showErrorMessage');
      const specialOptions = {
        acceptLanguage: uuid.v4(),
        generateClientRequestId: true,
      };
      serviceClient = new azureBlockchainServiceClient.AzureBlockchainServiceClient(
        credentials,
        subscriptionId,
        resourceGroup,
        baseUri,
        apiVersion,
        specialOptions,
      );
      // @ts-ignore
      pipelineMock = sinon.stub(serviceClient, 'pipeline');
    });

    afterEach(() => {
      windowMock.restore();
      pipelineMock.restore();
    });

    describe('getMembers', () => {
      it('shows error when request failed.', async () => {
        // Arrange
        const response = sinon.stub();
        const error = { message: uuid.v4() };
        const callbackFunctionSpy = sinon.spy(callbackFunction);

        pipelineMock.callsFake((...args: any[]): {} => {
          return args[1](error, response, defaultResponseBody);
        });

        // Act
        await serviceClient.getMembers(callbackFunctionSpy);

        // Assert
        assert.strictEqual(pipelineMock.calledOnce, true, 'pipeline should called once');
        assert.strictEqual(
          showErrorMessageMock.calledOnceWithExactly(error.message),
          true,
          'showErrorMessage should called once with correct arguments');
        assert.strictEqual(
          callbackFunctionSpy.calledOnceWithExactly(error as Error),
          true,
          'callbackFunction should called once with correct arguments');
      });

      describe('throws error when response is not success.', () => {
        const responseData = [
          [400, defaultResponseBody],
          [103, defaultResponseBody],
          [530, defaultResponseBody],
          [200, incorrectResponseBody]];
        responseData.forEach(async (response) => {
          it(`response status code is ${response[0]} and response body is ${JSON.stringify(response[1])}.`,
          async () => {
            // Arrange
            const res = {statusCode: response[0]};
            const callbackFunctionSpy = sinon.spy(callbackFunction);
            let pipelineCallbackSpy: any;

            pipelineMock.callsFake((...args: any[]): {} => {
              pipelineCallbackSpy = sinon.spy(args[1]);
              return pipelineCallbackSpy(null, res, response[1]);
            });

            // Act
            await serviceClient.getMembers(callbackFunctionSpy);

            // Assert
            assert.strictEqual(pipelineMock.calledOnce, true, 'pipeline should called once');
            assert.strictEqual(showErrorMessageMock.notCalled, true, 'showErrorMessage should not called');
            assert.strictEqual(callbackFunctionSpy.calledOnce, true, 'callbackFunction should called once');
            assert.strictEqual(
              callbackFunctionSpy.args[0][0] instanceof Error,
              true,
              'callbackFunction should called with correct arguments');
            assert.strictEqual(pipelineCallbackSpy.calledOnce, true, 'pipelineCallback should called once');
            assert.strictEqual(
              pipelineCallbackSpy.args[0][0],
              null,
              'callback function should called with correct arguments');
          });
        });
      });

      it('does not throw error when response is success.', async () => {
         // Arrange
         const res = {statusCode: 200};
         const callbackFunctionSpy = sinon.spy(callbackFunction);
         const parsedResult = JSON.parse(defaultResponseBody);
         let pipelineCallbackSpy: any;

         pipelineMock.callsFake((...args: any[]): {} => {
           pipelineCallbackSpy = sinon.spy(args[1]);
           return pipelineCallbackSpy(null, res, defaultResponseBody);
         });

         // Act
         await serviceClient.getMembers(callbackFunctionSpy);

         // Assert
         assert.strictEqual(pipelineMock.calledOnce, true, 'pipeline should called once');
         assert.strictEqual(showErrorMessageMock.notCalled, true, 'showErrorMessage should not called');
         assert.strictEqual(
           callbackFunctionSpy.calledOnceWithExactly(null, parsedResult),
           true,
           'callbackFunction should called once with correct arguments');
         assert.strictEqual(pipelineCallbackSpy.calledOnce, true, 'pipelineCallback should called once');
         assert.strictEqual(
          pipelineCallbackSpy.args[0][0],
           null,
           'callback function should called with correct arguments');
      });
    });

    describe('getTransactionNodes', () => {
      it('shows error when request failed.', async () => {
        // Arrange
        const response = sinon.stub();
        const error = { message: uuid.v4() };
        const callbackFunctionSpy = sinon.spy(callbackFunction);

        pipelineMock.callsFake((...args: any[]): {} => {
          return args[1](error, response, defaultResponseBody);
        });

        // Act
        await serviceClient.getTransactionNodes(memberName, callbackFunctionSpy);

        // Assert
        assert.strictEqual(pipelineMock.calledOnce, true, 'pipeline should called once');
        assert.strictEqual(
          showErrorMessageMock.calledOnceWithExactly(error.message),
          true,
          'showErrorMessage should called once with correct arguments');
        assert.strictEqual(
          callbackFunctionSpy.calledOnceWithExactly(error as Error),
          true,
          'callbackFunction should called once with correct arguments');
      });

      describe('throws error when response is not success.', () => {
        const responseData = [
          [400, defaultResponseBody],
          [103, defaultResponseBody],
          [530, defaultResponseBody],
          [200, incorrectResponseBody]];
        responseData.forEach(async (response) => {
          it(`response status code is ${response[0]} and response body is ${JSON.stringify(response[1])}.`,
          async () => {
            // Arrange
            const res = {statusCode: response[0]};
            const callbackFunctionSpy = sinon.spy(callbackFunction);
            let pipelineCallbackSpy: any;

            pipelineMock.callsFake((...args: any[]): {} => {
              pipelineCallbackSpy = sinon.spy(args[1]);
              return pipelineCallbackSpy(null, res, response[1]);
            });

            // Act
            await serviceClient.getTransactionNodes(memberName, callbackFunctionSpy);

            // Assert
            assert.strictEqual(pipelineMock.calledOnce, true, 'pipeline should called once');
            assert.strictEqual(showErrorMessageMock.notCalled, true, 'showErrorMessage should not called');
            assert.strictEqual(callbackFunctionSpy.calledOnce, true, 'callbackFunction should called once');
            assert.strictEqual(
              callbackFunctionSpy.args[0][0] instanceof Error,
              true,
              'callbackFunction should called with correct arguments');
            assert.strictEqual(pipelineCallbackSpy.calledOnce, true, 'pipelineCallback should called once');
            assert.strictEqual(
              pipelineCallbackSpy.args[0][0],
              null,
              'callback function should called with correct arguments');
          });
        });
      });

      it('does not throw error when response is success.', async () => {
         // Arrange
         const res = {statusCode: 200};
         const callbackFunctionSpy = sinon.spy(callbackFunction);
         const parsedResult = JSON.parse(defaultResponseBody);
         let pipelineCallbackSpy: any;

         pipelineMock.callsFake((...args: any[]): {} => {
           pipelineCallbackSpy = sinon.spy(args[1]);
           return pipelineCallbackSpy(null, res, defaultResponseBody);
         });

         // Act
         await serviceClient.getTransactionNodes(memberName, callbackFunctionSpy);

         // Assert
         assert.strictEqual(pipelineMock.calledOnce, true, 'pipeline should called once');
         assert.strictEqual(showErrorMessageMock.notCalled, true, 'showErrorMessage should not called');
         assert.strictEqual(
           callbackFunctionSpy.calledOnceWithExactly(null, parsedResult),
           true,
           'callbackFunction should called once with correct arguments');
         assert.strictEqual(pipelineCallbackSpy.calledOnce, true, 'pipelineCallback should called once');
         assert.strictEqual(
           pipelineCallbackSpy.args[0][0],
           null,
           'callback function should called with correct arguments');
      });
    });

    describe('getTransactionNodeAccessKeys', () => {
      it('shows error when request failed.', async () => {
        // Arrange
        const response = sinon.stub();
        const error = { message: uuid.v4() };
        const callbackFunctionSpy = sinon.spy(callbackFunction);

        pipelineMock.callsFake((...args: any[]): {} => {
          return args[1](error, response, defaultResponseBody);
        });

        // Act
        await serviceClient.getTransactionNodeAccessKeys(memberName, transactionNode, callbackFunctionSpy);

        // Assert
        assert.strictEqual(pipelineMock.calledOnce, true, 'pipeline should called once');
        assert.strictEqual(
          showErrorMessageMock.calledOnceWithExactly(error.message),
          true,
          'showErrorMessage should called once with correct arguments');
        assert.strictEqual(
          callbackFunctionSpy.calledOnceWithExactly(error as Error),
          true,
          'callbackFunction should called once with correct arguments');
      });

      describe('throws error when response is not success.', () => {
        const responseData = [
          [400, defaultResponseBody],
          [103, defaultResponseBody],
          [530, defaultResponseBody],
          [200, incorrectResponseBody]];
        responseData.forEach(async (response) => {
          it(`response status code is ${response[0]} and response body is ${JSON.stringify(response[1])}.`,
          async () => {
            // Arrange
            const res = {statusCode: response[0]};
            const callbackFunctionSpy = sinon.spy(callbackFunction);
            let pipelineCallbackSpy: any;

            pipelineMock.callsFake((...args: any[]): {} => {
              pipelineCallbackSpy = sinon.spy(args[1]);
              return pipelineCallbackSpy(null, res, response[1]);
            });

            // Act
            await serviceClient.getTransactionNodeAccessKeys(memberName, transactionNode, callbackFunctionSpy);

            // Assert
            assert.strictEqual(pipelineMock.calledOnce, true, 'pipeline should called once');
            assert.strictEqual(showErrorMessageMock.notCalled, true, 'showErrorMessage should not called');
            assert.strictEqual(callbackFunctionSpy.calledOnce, true, 'callbackFunction should called once');
            assert.strictEqual(
              callbackFunctionSpy.args[0][0] instanceof Error,
              true,
              'callbackFunction should called with correct arguments');
            assert.strictEqual(pipelineCallbackSpy.calledOnce, true, 'pipelineCallback should called once');
            assert.strictEqual(
              pipelineCallbackSpy.args[0][0],
              null,
              'callback function should called with correct arguments');
          });
        });
      });

      it('does not throw error when response is success.', async () => {
         // Arrange
         const res = {statusCode: 200};
         const callbackFunctionSpy = sinon.spy(callbackFunction);
         const parsedResult = JSON.parse(defaultResponseBody);
         let pipelineCallbackSpy: any;

         pipelineMock.callsFake((...args: any[]): {} => {
           pipelineCallbackSpy = sinon.spy(args[1]);
           return pipelineCallbackSpy(null, res, defaultResponseBody);
         });

         // Act
         await serviceClient.getTransactionNodeAccessKeys(memberName, transactionNode, callbackFunctionSpy);

         // Assert
         assert.strictEqual(pipelineMock.calledOnce, true, 'pipeline should called once');
         assert.strictEqual(showErrorMessageMock.notCalled, true, 'showErrorMessage should not called');
         assert.strictEqual(
           callbackFunctionSpy.calledOnceWithExactly(null, parsedResult),
           true,
           'callbackFunction should called once with correct arguments');
         assert.strictEqual(pipelineCallbackSpy.calledOnce, true, 'pipelineCallback should called once');
         assert.strictEqual(
           pipelineCallbackSpy.args[0][0],
           null,
           'callback function should called with correct arguments');
      });
    });

    describe('getSkus', () => {
      it('shows error when request failed.', async () => {
        // Arrange
        const response = sinon.stub();
        const error = { message: uuid.v4() };
        const callbackFunctionSpy = sinon.spy(callbackFunction);

        pipelineMock.callsFake((...args: any[]): {} => {
          return args[1](error, response, defaultResponseBody);
        });

        // Act
        await serviceClient.getSkus(callbackFunctionSpy);

        // Assert
        assert.strictEqual(pipelineMock.calledOnce, true, 'pipeline should called once');
        assert.strictEqual(
          showErrorMessageMock.calledOnceWithExactly(error.message),
          true,
          'showErrorMessage should called once with correct arguments');
        assert.strictEqual(
          callbackFunctionSpy.calledOnceWithExactly(error as Error),
          true,
          'callbackFunction should called once with correct arguments');
      });

      describe('throws error when response is not success.', () => {
        const responseData = [
          [400, defaultResponseBody],
          [103, defaultResponseBody],
          [530, defaultResponseBody],
          [200, incorrectResponseBody]];
        responseData.forEach(async (response) => {
          it(`response status code is ${response[0]} and response body is ${JSON.stringify(response[1])}.`,
          async () => {
            // Arrange
            const res = {statusCode: response[0]};
            const callbackFunctionSpy = sinon.spy(callbackFunction);
            let pipelineCallbackSpy: any;

            pipelineMock.callsFake((...args: any[]): {} => {
              pipelineCallbackSpy = sinon.spy(args[1]);
              return pipelineCallbackSpy(null, res, response[1]);
            });

            // Act
            await serviceClient.getSkus(callbackFunctionSpy);

            // Assert
            assert.strictEqual(pipelineMock.calledOnce, true, 'pipeline should called once');
            assert.strictEqual(showErrorMessageMock.notCalled, true, 'showErrorMessage should not called');
            assert.strictEqual(callbackFunctionSpy.calledOnce, true, 'callbackFunction should called once');
            assert.strictEqual(
              callbackFunctionSpy.args[0][0] instanceof Error,
              true,
              'callbackFunction should called with correct arguments');
            assert.strictEqual(pipelineCallbackSpy.calledOnce, true, 'pipelineCallback should called once');
            assert.strictEqual(
              pipelineCallbackSpy.args[0][0],
              null,
              'callback function should called with correct arguments');
          });
        });
      });

      it('does not throw error when response is success.', async () => {
         // Arrange
         const res = {statusCode: 200};
         const callbackFunctionSpy = sinon.spy(callbackFunction);
         const parsedResult = JSON.parse(defaultResponseBody);
         let pipelineCallbackSpy: any;

         pipelineMock.callsFake((...args: any[]): {} => {
           pipelineCallbackSpy = sinon.spy(args[1]);
           return pipelineCallbackSpy(null, res, defaultResponseBody);
         });

         // Act
         await serviceClient.getSkus(callbackFunctionSpy);

         // Assert
         assert.strictEqual(pipelineMock.calledOnce, true, 'pipeline should called once');
         assert.strictEqual(showErrorMessageMock.notCalled, true, 'showErrorMessage should not called');
         assert.strictEqual(
           callbackFunctionSpy.calledOnceWithExactly(null, parsedResult),
           true,
           'callbackFunction should called once with correct arguments');
         assert.strictEqual(pipelineCallbackSpy.calledOnce, true, 'pipelineCallback should called once');
         assert.strictEqual(
           pipelineCallbackSpy.args[0][0],
          null,
          'callback function should called with correct arguments');
      });
    });
  });
});
