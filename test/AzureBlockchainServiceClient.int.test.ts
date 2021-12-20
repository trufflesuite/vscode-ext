// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import assert from "assert";
import {ServiceClientCredentials} from "ms-rest";
import sinon from "sinon";
import uuid from "uuid";
import vscode from "vscode";
import {AzureBlockchainServiceClient} from "../src/ARMBlockchain";

describe("Integration tests for AzureBlockchainServiceClient", () => {
  let credentials: ServiceClientCredentials;
  const trufflesuiteClient = require("../src/ARMBlockchain/AzureBlockchainServiceClient");
  const defaultResponseBody = '{ "message": "default response body" }';
  let callbackFunction: (error: Error | null, result?: any) => void;

  const incorrectResponseBody = uuid.v4();
  let windowMock: sinon.SinonMock;
  let showErrorMessageMock: sinon.SinonExpectation;
  let pipelineMock: sinon.SinonStub<any[], any> | sinon.SinonStub<unknown[], {}>;
  let serviceClient: AzureBlockchainServiceClient;
  let callbackFunctionSpy: any;

  before(() => {
    credentials = {
      signRequest: () => undefined,
    };
    callbackFunction = (_error: Error | null, _result?: any) => undefined;
  });

  beforeEach(() => {
    sinon.stub(trufflesuiteClient.__proto__, "constructor");

    windowMock = sinon.mock(vscode.window);
    showErrorMessageMock = windowMock.expects("showErrorMessage");
    const specialOptions = {
      acceptLanguage: uuid.v4(),
      generateClientRequestId: true,
    };
    serviceClient = new trufflesuiteClient.AzureBlockchainServiceClient(
      credentials,
      uuid.v4(),
      uuid.v4(),
      uuid.v4(),
      specialOptions
    );
    // @ts-ignore
    pipelineMock = sinon.stub(serviceClient, "pipeline");
    callbackFunctionSpy = sinon.spy(callbackFunction);
  });

  afterEach(() => {
    sinon.restore();
  });

  function assertRequestFailed(error: any, callbackSpy: sinon.SinonSpy<[Error | null, any?], void>): void {
    assert.strictEqual(pipelineMock.calledOnce, true, "pipeline should called once");
    assert.strictEqual(
      showErrorMessageMock.calledOnceWithExactly(error.message),
      true,
      "showErrorMessage should called once with correct arguments"
    );
    assert.strictEqual(
      callbackSpy.calledOnceWithExactly(error),
      true,
      "callbackFunction should called once with correct arguments"
    );
  }

  function assertResponseNotSuccess(
    callbackSpy: sinon.SinonSpy<[Error | null, any?], void>,
    pipelineCallbackSpy: sinon.SinonSpy
  ): void {
    assert.strictEqual(pipelineMock.calledOnce, true, "pipeline should called once");
    assert.strictEqual(showErrorMessageMock.notCalled, true, "showErrorMessage should not called");
    assert.strictEqual(callbackSpy.calledOnce, true, "callbackFunction should called once");
    assert.strictEqual(
      callbackSpy.args[0][0] instanceof Error,
      true,
      "callbackFunction should called with correct arguments"
    );
    assert.strictEqual(pipelineCallbackSpy.calledOnce, true, "pipelineCallback should called once");
    assert.strictEqual(pipelineCallbackSpy.args[0][0], null, "callback function should called with correct arguments");
  }

  function assertResponseSuccess(
    callbackSpy: sinon.SinonSpy<[Error | null, any?], void>,
    pipelineCallbackSpy: sinon.SinonSpy,
    parsedResult: any
  ): void {
    assert.strictEqual(pipelineMock.calledOnce, true, "pipeline should called once");
    assert.strictEqual(showErrorMessageMock.notCalled, true, "showErrorMessage should not called");
    assert.strictEqual(
      callbackSpy.calledOnceWithExactly(null, parsedResult),
      true,
      "callbackFunction should called once with correct arguments"
    );
    assert.strictEqual(pipelineCallbackSpy.calledOnce, true, "pipelineCallback should called once");
    assert.strictEqual(pipelineCallbackSpy.args[0][0], null, "callback function should called with correct arguments");
  }

  const listOfMethod = [
    {
      callback: async () => await serviceClient.getMembers("consortiumName", callbackFunctionSpy),
      methodName: "getMembers",
    },
    {
      callback: async () => await serviceClient.getTransactionNodes(uuid.v4(), callbackFunctionSpy),
      methodName: "getTransactionNodes",
    },
    {
      callback: async () => await serviceClient.getTransactionNodeAccessKeys(uuid.v4(), uuid.v4(), callbackFunctionSpy),
      methodName: "getTransactionNodeAccessKeys",
    },
    {callback: async () => await serviceClient.getSkus(callbackFunctionSpy), methodName: "getSkus"},
    {callback: async () => await serviceClient.getConsortia(callbackFunctionSpy), methodName: "getConsortia"},
    {
      callback: async () => await serviceClient.getBlockchainDataManagers(callbackFunctionSpy),
      methodName: "getBlockchainDataManagers",
    },
    {
      callback: async () => await serviceClient.getBlockchainDataManagerOutputs(uuid.v4(), callbackFunctionSpy),
      methodName: "getBlockchainDataManagerOutputs",
    },
    {
      callback: async () => await serviceClient.getBlockchainDataManagerInputs(uuid.v4(), callbackFunctionSpy),
      methodName: "getBlockchainDataManagerInputs",
    },
    {
      callback: async () => await serviceClient.getBlockchainDataManagerApplications(uuid.v4(), callbackFunctionSpy),
      methodName: "getBlockchainDataManagerApplications",
    },
    {
      callback: async () => await serviceClient.createBlockchainDataManager(uuid.v4(), "{}", callbackFunctionSpy),
      methodName: "createBlockchainDataManager",
    },
    {
      callback: async () =>
        await serviceClient.createBlockchainDataManagerInput(uuid.v4(), uuid.v4(), "{}", callbackFunctionSpy),
      methodName: "createBlockchainDataManagerInput",
    },
    {
      callback: async () =>
        await serviceClient.createBlockchainDataManagerOutput(uuid.v4(), uuid.v4(), "{}", callbackFunctionSpy),
      methodName: "createBlockchainDataManagerOutput",
    },
    {
      callback: async () => await serviceClient.removeBlockchainDataManager(uuid.v4(), callbackFunctionSpy),
      methodName: "removeBlockchainDataManager",
    },
  ];

  listOfMethod.forEach((method) => {
    describe(method.methodName, () => {
      it("shows error when request failed.", async () => {
        // Arrange
        const response = sinon.stub();
        const error = {message: uuid.v4()};

        pipelineMock.callsFake((...args: any[]): {} => {
          return args[1](error, response, defaultResponseBody);
        });

        // Act
        await method.callback();

        // Assert
        assertRequestFailed(error, callbackFunctionSpy);
      });

      describe("throws error when response is not success.", () => {
        const responseData = [
          [400, defaultResponseBody],
          [103, defaultResponseBody],
          [530, defaultResponseBody],
          [200, incorrectResponseBody],
        ];
        responseData.forEach(async (response) => {
          it(`response status code is ${response[0]} and response body is ${JSON.stringify(
            response[1]
          )}.`, async () => {
            // Arrange
            const res = {statusCode: response[0]};
            let pipelineCallbackSpy: any;

            pipelineMock.callsFake((...args: any[]): {} => {
              pipelineCallbackSpy = sinon.spy(args[1]);
              return pipelineCallbackSpy(null, res, response[1]);
            });

            // Act
            await method.callback();

            // Assert
            assertResponseNotSuccess(callbackFunctionSpy, pipelineCallbackSpy);
          });
        });
      });

      it("does not throw error when response is success.", async () => {
        // Arrange
        const res = {statusCode: 200};
        const parsedResult = JSON.parse(defaultResponseBody);
        let pipelineCallbackSpy: any;

        pipelineMock.callsFake((...args: any[]): {} => {
          pipelineCallbackSpy = sinon.spy(args[1]);
          return pipelineCallbackSpy(null, res, defaultResponseBody);
        });

        // Act
        await method.callback();

        // Assert
        assertResponseSuccess(callbackFunctionSpy, pipelineCallbackSpy, parsedResult);
      });
    });
  });
});
