// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import assert from "assert";
import {ServiceClientCredentials} from "ms-rest";
import msrestazure from "ms-rest-azure";
import sinon from "sinon";
import uuid from "uuid";
import {EventGridManagementClient} from "../src/ARMBlockchain/EventGridManagementClient";

describe("Unit tests for EventGridManagementClient", () => {
  let credentials: ServiceClientCredentials;
  const eventGridManagementClient = require("../src/ARMBlockchain/EventGridManagementClient");
  let callbackFunction: (error: Error | null, result?: any) => void;
  let callbackFunctionSpy: any;

  before(() => {
    credentials = {
      signRequest: () => undefined,
    };
    callbackFunction = (_error: Error | null, _result?: any) => undefined;
  });

  beforeEach(() => {
    sinon.stub(eventGridManagementClient.__proto__, "constructor");
    callbackFunctionSpy = sinon.spy(callbackFunction);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("Public methods.", () => {
    let serviceClient: EventGridManagementClient;
    let pipelineMock: sinon.SinonStub<any[], any> | sinon.SinonStub<unknown[], {}>;

    beforeEach(() => {
      serviceClient = new eventGridManagementClient.EventGridManagementClient(
        credentials,
        uuid.v4(),
        uuid.v4(),
        uuid.v4(),
        {} as msrestazure.AzureServiceClientOptions
      );
      // @ts-ignore
      pipelineMock = sinon.stub(serviceClient, "pipeline");
    });

    afterEach(() => {
      pipelineMock.restore();
      sinon.restore();
    });

    const listOfMethod = [
      {
        callback: async () => await serviceClient.getEventGridList(callbackFunctionSpy),
        methodName: "getEventGridList",
      },
      {
        callback: async () => await serviceClient.getEventGridItem(uuid.v4(), callbackFunctionSpy),
        methodName: "getEventGridItem",
      },
      {
        callback: async () => await serviceClient.createEventGrid(uuid.v4(), uuid.v4(), callbackFunctionSpy),
        methodName: "createEventGrid",
      },
    ];

    listOfMethod.forEach((method) => {
      it(`${method.methodName} returns error.`, async () => {
        // Arrange
        const error = new Error(uuid.v4());
        pipelineMock.callsFake((...args: any[]): {} => {
          return args[1](error);
        });

        // Act
        await method.callback();

        // Assert
        assert.strictEqual(pipelineMock.calledOnce, true, "pipelineMock should called once");
        assert.strictEqual(
          callbackFunctionSpy.calledOnceWithExactly(error),
          true,
          "callbackFunction should called once with correct arguments"
        );
      });

      it(`${method.methodName} does not return error.`, async () => {
        // Arrange
        const expectedData = "{}";
        pipelineMock.callsFake((...args: any[]): {} => {
          return args[1](null, true, expectedData);
        });

        // Act
        await method.callback();

        // Assert
        assert.strictEqual(pipelineMock.calledOnce, true, "pipelineMock should called once");
        assert.strictEqual(
          callbackFunctionSpy.calledOnceWithExactly(null, JSON.parse(expectedData)),
          true,
          "callbackFunction should called once with correct arguments"
        );
      });
    });
  });
});
