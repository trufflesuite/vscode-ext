// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as assert from 'assert';
import { ServiceClientCredentials } from 'ms-rest';
import * as msrestazure from 'ms-rest-azure';
import * as sinon from 'sinon';
import * as uuid from 'uuid';
import { StorageAccountClient } from '../src/ARMBlockchain/StorageAccountClient';

describe('Unit tests for StorageAccountClient', () => {
  let credentials: ServiceClientCredentials;
  const storageAccountClient = require('../src/ARMBlockchain/StorageAccountClient');
  let callbackFunction: (error: Error | null, result?: any) => void;
  let callbackFunctionSpy: any;
  let options: msrestazure.AzureServiceClientOptions;
  let resultElement: string;

  before(() => {
    credentials = {
      signRequest: () => undefined,
    };
    callbackFunction = (_error: Error | null, _result?: any) => undefined;
    options = {};
    resultElement = uuid.v4();
  });

  beforeEach(() => {
    sinon.stub(storageAccountClient.__proto__, 'constructor');

    callbackFunctionSpy = sinon.spy(callbackFunction);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Public methods.', () => {
    let serviceClient: StorageAccountClient;
    let pipelineMock: sinon.SinonStub<any[], any> | sinon.SinonStub<unknown[], {}>;
    let sendRequestToAzureMock: sinon.SinonStub<any[], any>;

    beforeEach(() => {
      serviceClient = new storageAccountClient.StorageAccountClient(
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
      { callback: async () => await serviceClient.getStorageAccountList(callbackFunctionSpy),
        methodName: 'getStorageAccountList' },
      { callback: async () => await serviceClient.getListAccountSas(uuid.v4(), uuid.v4(), callbackFunctionSpy),
        methodName: 'getListAccountSas' },
      { callback: async () => await serviceClient.createStorageAccount(uuid.v4(), uuid.v4(), callbackFunctionSpy),
        methodName: 'createStorageAccount' },
      { callback: async () =>
          await serviceClient.getStorageAccount(uuid.v4(), callbackFunctionSpy),
        methodName: 'getStorageAccount' },
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
