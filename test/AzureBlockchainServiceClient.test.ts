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
        assert.notStrictEqual(serviceClient, undefined);
        assert.strictEqual(serviceClient.constructor.name, AzureBlockchainServiceClient.name);
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
              Constants.errorMessageStrings.VariableDoesNotExist(Constants.serviceClientVariables.subscriptionId));
            assert.strictEqual(serviceClient, undefined);
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
              Constants.errorMessageStrings.VariableDoesNotExist(Constants.serviceClientVariables.credentials));
            assert.strictEqual(serviceClient, undefined);
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
        assert.strictEqual(pipelineMock.calledOnce, true);
        assert.strictEqual(outputLineMock
          .calledOnceWithExactly(Constants.outputChannel.azureBlockchainServiceClient, error.message), true);
        assert.strictEqual(openExternalSpy.notCalled, true);
      });

      describe('createConsortium shows error when response is not successed.', () => {
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
            assert.strictEqual(pipelineMock.calledOnce, true);
            assert.strictEqual(callbackSpy.args[0][0], null);
            assert.strictEqual(outputLineMock
              .calledOnceWithExactly(
                Constants.outputChannel.azureBlockchainServiceClient,
                `${response.statusMessage}(${response.statusCode}): ${defaultResponseBody}`),
                  true);
            assert.strictEqual(openExternalSpy.notCalled, true);
            assert.strictEqual(showErrorMessageMock.calledOnceWithExactly(
              Constants.executeCommandMessage.failedToRunCommand('CreateConsortium')), true);
          });
        });
      });

      describe('createConsortium does not show error when response is successed.', () => {
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
            assert.strictEqual(pipelineMock.calledOnce, true);
            assert.strictEqual(callbackSpy.args[0][0], null);
            assert.strictEqual(outputLineMock.notCalled, true);
            assert.strictEqual(showErrorMessageMock.notCalled, true);
            assert.strictEqual(openExternalSpy.calledOnce, true);
            assert.strictEqual(openExternalSpy.args[0][0] instanceof vscode.Uri, true);
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
        assert.strictEqual(sendRequestToAzureMock.calledOnce, true);
        assert.strictEqual(callbackFunctionSpy.calledOnceWithExactly(error), true);
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
        assert.strictEqual(sendRequestToAzureMock.calledOnce, true);
        assert.strictEqual(callbackFunctionSpy.calledOnceWithExactly(null, resultElement), true);
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
        assert.strictEqual(sendRequestToAzureMock.calledOnce, true);
        assert.strictEqual(callbackFunctionSpy.calledOnceWithExactly(error), true);
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
        assert.strictEqual(sendRequestToAzureMock.calledOnce, true);
        assert.strictEqual(callbackFunctionSpy.calledOnceWithExactly(null, resultElement), true);
      });

      it('getMemberAccessKeys returns error.', async () => {
        // Arrange
        const callbackFunctionSpy = sinon.spy(callbackFunction);
        const error = new Error(uuid.v4());
        sendRequestToAzureMock.callsFake((...args: any[]): {} => {
          return args[1](error);
        });

        // Act
        await serviceClient.getMemberAccessKeys(memberName, callbackFunctionSpy);

        // Assert
        assert.strictEqual(sendRequestToAzureMock.calledOnce, true);
        assert.strictEqual(callbackFunctionSpy.calledOnceWithExactly(error), true);
      });

      it('getMemberAccessKeys does not return error.', async () => {
        // Arrange
        const callbackFunctionSpy = sinon.spy(callbackFunction);
        sendRequestToAzureMock.callsFake((...args: any[]): {} => {
          return args[1](null, resultElement);
        });

        // Act
        await serviceClient.getMemberAccessKeys(memberName, callbackFunctionSpy);

        // Assert
        assert.strictEqual(sendRequestToAzureMock.calledOnce, true);
        assert.strictEqual(callbackFunctionSpy.calledOnceWithExactly(null, resultElement), true);
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
        assert.strictEqual(sendRequestToAzureMock.calledOnce, true);
        assert.strictEqual(callbackFunctionSpy.calledOnceWithExactly(error), true);
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
        assert.strictEqual(sendRequestToAzureMock.calledOnce, true);
        assert.strictEqual(callbackFunctionSpy.calledOnceWithExactly(null, resultElement), true);
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
        assert.strictEqual(pipelineMock.calledOnce, true);
        assert.strictEqual(showErrorMessageMock.calledOnceWithExactly(error.message), true);
        assert.strictEqual(callbackFunctionSpy.calledOnceWithExactly(error as Error), true);
      });

      describe('throws error when response is not successed.', () => {
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
            assert.strictEqual(pipelineMock.calledOnce, true);
            assert.strictEqual(showErrorMessageMock.notCalled, true);
            assert.strictEqual(callbackFunctionSpy.calledOnce, true);
            assert.strictEqual(callbackFunctionSpy.args[0][0] instanceof Error, true);
            assert.strictEqual(pipelineCallbackSpy.calledOnce, true);
            assert.strictEqual(pipelineCallbackSpy.args[0][0], null);
          });
        });
      });

      it('does not throw error when response is successed.', async () => {
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
         assert.strictEqual(pipelineMock.calledOnce, true);
         assert.strictEqual(showErrorMessageMock.notCalled, true);
         assert.strictEqual(callbackFunctionSpy.calledOnceWithExactly(null, parsedResult), true);
         assert.strictEqual(pipelineCallbackSpy.calledOnce, true);
         assert.strictEqual(pipelineCallbackSpy.args[0][0], null);
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
        assert.strictEqual(pipelineMock.calledOnce, true);
        assert.strictEqual(showErrorMessageMock.calledOnceWithExactly(error.message), true);
        assert.strictEqual(callbackFunctionSpy.calledOnceWithExactly(error as Error), true);
      });

      describe('throws error when response is not successed.', () => {
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
            assert.strictEqual(pipelineMock.calledOnce, true);
            assert.strictEqual(showErrorMessageMock.notCalled, true);
            assert.strictEqual(callbackFunctionSpy.calledOnce, true);
            assert.strictEqual(callbackFunctionSpy.args[0][0] instanceof Error, true);
            assert.strictEqual(pipelineCallbackSpy.calledOnce, true);
            assert.strictEqual(pipelineCallbackSpy.args[0][0], null);
          });
        });
      });

      it('does not throw error when response is successed.', async () => {
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
         assert.strictEqual(pipelineMock.calledOnce, true);
         assert.strictEqual(showErrorMessageMock.notCalled, true);
         assert.strictEqual(callbackFunctionSpy.calledOnceWithExactly(null, parsedResult), true);
         assert.strictEqual(pipelineCallbackSpy.calledOnce, true);
         assert.strictEqual(pipelineCallbackSpy.args[0][0], null);
      });
    });

    describe('getMemberAccessKeys', () => {
      it('shows error when request failed.', async () => {
        // Arrange
        const response = sinon.stub();
        const error = { message: uuid.v4() };
        const callbackFunctionSpy = sinon.spy(callbackFunction);

        pipelineMock.callsFake((...args: any[]): {} => {
          return args[1](error, response, defaultResponseBody);
        });

        // Act
        await serviceClient.getMemberAccessKeys(memberName, callbackFunctionSpy);

        // Assert
        assert.strictEqual(pipelineMock.calledOnce, true);
        assert.strictEqual(showErrorMessageMock.calledOnceWithExactly(error.message), true);
        assert.strictEqual(callbackFunctionSpy.calledOnceWithExactly(error as Error), true);
      });

      describe('throws error when response is not successed.', () => {
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
            await serviceClient.getMemberAccessKeys(memberName, callbackFunctionSpy);

            // Assert
            assert.strictEqual(pipelineMock.calledOnce, true);
            assert.strictEqual(showErrorMessageMock.notCalled, true);
            assert.strictEqual(callbackFunctionSpy.calledOnce, true);
            assert.strictEqual(callbackFunctionSpy.args[0][0] instanceof Error, true);
            assert.strictEqual(pipelineCallbackSpy.calledOnce, true);
            assert.strictEqual(pipelineCallbackSpy.args[0][0], null);
          });
        });
      });

      it('does not throw error when response is successed.', async () => {
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
         await serviceClient.getMemberAccessKeys(memberName, callbackFunctionSpy);

         // Assert
         assert.strictEqual(pipelineMock.calledOnce, true);
         assert.strictEqual(showErrorMessageMock.notCalled, true);
         assert.strictEqual(callbackFunctionSpy.calledOnceWithExactly(null, parsedResult), true);
         assert.strictEqual(pipelineCallbackSpy.calledOnce, true);
         assert.strictEqual(pipelineCallbackSpy.args[0][0], null);
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
        assert.strictEqual(pipelineMock.calledOnce, true);
        assert.strictEqual(showErrorMessageMock.calledOnceWithExactly(error.message), true);
        assert.strictEqual(callbackFunctionSpy.calledOnceWithExactly(error as Error), true);
      });

      describe('throws error when response is not successed.', () => {
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
            assert.strictEqual(pipelineMock.calledOnce, true);
            assert.strictEqual(showErrorMessageMock.notCalled, true);
            assert.strictEqual(callbackFunctionSpy.calledOnce, true);
            assert.strictEqual(callbackFunctionSpy.args[0][0] instanceof Error, true);
            assert.strictEqual(pipelineCallbackSpy.calledOnce, true);
            assert.strictEqual(pipelineCallbackSpy.args[0][0], null);
          });
        });
      });

      it('does not throw error when response is successed.', async () => {
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
         assert.strictEqual(pipelineMock.calledOnce, true);
         assert.strictEqual(showErrorMessageMock.notCalled, true);
         assert.strictEqual(callbackFunctionSpy.calledOnceWithExactly(null, parsedResult), true);
         assert.strictEqual(pipelineCallbackSpy.calledOnce, true);
         assert.strictEqual(pipelineCallbackSpy.args[0][0], null);
      });
    });
  });
});
