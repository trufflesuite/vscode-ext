// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as assert from 'assert';
import { ServiceClientCredentials } from 'ms-rest';
import * as msrestazure from 'ms-rest-azure';
import * as sinon from 'sinon';
import * as uuid from 'uuid';
import * as vscode from 'vscode';
import { AzureBlockchainServiceClient } from '../src/ARMBlockchain/AzureBlockchainServiceClient';

describe('Unit tests for AzureBlockchainServiceClient', () => {
  let credentials: ServiceClientCredentials;
  let memberName: string;
  const azureBlockchainServiceClient = require('../src/ARMBlockchain/AzureBlockchainServiceClient');
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
    memberName = uuid.v4();
    sinon.stub(azureBlockchainServiceClient.__proto__, 'constructor');

    callbackFunctionSpy = sinon.spy(callbackFunction);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Public methods.', () => {
    let serviceClient: AzureBlockchainServiceClient;
    let pipelineMock: sinon.SinonStub<any[], any> | sinon.SinonStub<unknown[], {}>;
    let sendRequestToAzureMock: sinon.SinonStub<any[], any>;

    beforeEach(() => {
      serviceClient = new azureBlockchainServiceClient.AzureBlockchainServiceClient(
        credentials,
        uuid.v4(),
        uuid.v4(),
        uuid.v4(),
        options,
      );
      // @ts-ignore
      pipelineMock = sinon.stub(serviceClient, 'pipeline');
      sendRequestToAzureMock = sinon.stub(serviceClient, 'sendRequestToAzure' as any);
    });

    afterEach(() => {
      sendRequestToAzureMock.restore();
      pipelineMock.restore();
      sinon.restore();
    });

    const listOfMethod = [
      { callback: async () => await serviceClient.getMembers('consortiumName', callbackFunctionSpy),
        methodName: 'getMembers' },
      { callback: async () => await serviceClient.getConsortia(callbackFunctionSpy),
        methodName: 'getConsortia' },
      { callback: async () => await serviceClient.getTransactionNodes(uuid.v4(), callbackFunctionSpy),
        methodName: 'getTransactionNodes' },
      { callback: async () =>
          await serviceClient.getTransactionNodeAccessKeys(uuid.v4(), uuid.v4(), callbackFunctionSpy),
        methodName: 'getTransactionNodeAccessKeys' },
      { callback: async () => await serviceClient.getSkus(callbackFunctionSpy),
        methodName: 'getSkus' },
      { callback: async () => await serviceClient.getBlockchainDataManagers(callbackFunctionSpy),
        methodName: 'getBlockchainDataManagers' },
      { callback: async () => await serviceClient.getBlockchainDataManagerApplications(uuid.v4(), callbackFunctionSpy),
        methodName: 'getBlockchainDataManagerApplications' },
      { callback: async () => await serviceClient.getBlockchainDataManagerOutputs(uuid.v4(), callbackFunctionSpy),
        methodName: 'getBlockchainDataManagerOutputs' },
      { callback: async () => await serviceClient.getBlockchainDataManagerInputs(uuid.v4(), callbackFunctionSpy),
        methodName: 'getBlockchainDataManagerInputs' },
      { callback: async () => await serviceClient.createBlockchainDataManager(uuid.v4(), '{}', callbackFunctionSpy),
        methodName: 'createBlockchainDataManager' },
      { callback: async () =>
        await serviceClient.createBlockchainDataManagerInput(uuid.v4(), uuid.v4(), '{}', callbackFunctionSpy),
        methodName: 'createBlockchainDataManagerInput' },
      { callback: async () =>
        await serviceClient.createBlockchainDataManagerOutput(uuid.v4(), uuid.v4(), '{}', callbackFunctionSpy),
        methodName: 'createBlockchainDataManagerOutput' },
      { callback: async () => await serviceClient.removeBlockchainDataManager(uuid.v4(), callbackFunctionSpy),
        methodName: 'removeBlockchainDataManager' },
      { callback: async () => await serviceClient
          .createBlockchainDataManagerApplication(uuid.v4(), uuid.v4(), uuid.v4(), callbackFunctionSpy),
        methodName: 'createBlockchainDataManagerApplication' },
      { callback: async () => await serviceClient
          .getBlockchainDataManagerApplication(uuid.v4(), uuid.v4(), callbackFunctionSpy),
        methodName: 'getBlockchainDataManagerApplication' },
      { callback: async () => await serviceClient
          .deleteBlockchainDataManagerApplication(uuid.v4(), uuid.v4(), callbackFunctionSpy),
        methodName: 'deleteBlockchainDataManagerApplication' },
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

    const methodList = [
      { callback: async () => await serviceClient.createConsortium(memberName, body, callbackFunctionSpy),
        methodName: 'createConsortium' },
      { callback: async () => await serviceClient.startBlockchainDataManager(uuid.v4(), callbackFunctionSpy),
        methodName: 'startBlockchainDataManager' },
    ];
    methodList.forEach((method) => {
      describe(method.methodName, () => {
        let windowMock: sinon.SinonMock;
        let showErrorMessageMock: sinon.SinonExpectation;

        beforeEach(() => {
          windowMock = sinon.mock(vscode.window);
          showErrorMessageMock = windowMock.expects('showErrorMessage');
        });

        afterEach(() => {
          windowMock.restore();
          sinon.restore();
        });

        it('shows error when response has error', async () => {
          // Arrange
          const error = { message: uuid.v4() };
          sendRequestToAzureMock.restore();
          pipelineMock.callsFake((...args: any[]): {} => {
            return args[1](error);
          });

          // Act
          await method.callback();

          // Assert
          assert.strictEqual(showErrorMessageMock.calledOnce, true, 'showErrorMessage should called once');
          assert.strictEqual(
            callbackFunctionSpy.calledOnceWithExactly(error),
            true,
            'callbackFunction should called once with correct arguments');
        });

        describe('shows error when response is not success.', () => {
          const statusCodes = [103, 300, 400, 498];
          statusCodes.forEach(async (statusCode) => {
            it(`response status code is ${statusCode}.`, async () => {
              // Arrange
              sendRequestToAzureMock.restore();
              pipelineMock.callsFake((...args: any[]): {} => {
                return args[1](null, { statusCode });
              });

              // Act
              await method.callback();

              // Assert
              assert.strictEqual(showErrorMessageMock.notCalled, true, 'showErrorMessage should not called');
              assert.strictEqual(callbackFunctionSpy.calledOnce, true, 'callbackFunction should called once');
            });
          });
        });

        describe('does not show error when response is success.', () => {
          const statusCodes = [200, 207, 226];
          statusCodes.forEach(async (statusCode) => {
            it(`response status code is ${statusCode}.`, async () => {
              // Arrange
              sendRequestToAzureMock.restore();
              pipelineMock.callsFake((...args: any[]): {} => {
                return args[1](null, { statusCode }, '');
              });

              // Act
              await method.callback();

              // Assert
              assert.strictEqual(showErrorMessageMock.notCalled, true, 'showErrorMessage should not called');
              assert.strictEqual(
                callbackFunctionSpy.calledOnceWithExactly(null),
                true,
                'callbackFunction should called once with correct arguments');
            });
          });
        });
      });
    });
  });
});
