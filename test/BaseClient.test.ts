// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import * as assert from "assert";
import { ServiceClientCredentials } from "ms-rest";
import * as msrestazure from "ms-rest-azure";
import * as sinon from "sinon";
import * as uuid from "uuid";
import { BaseClient } from "../src/ARMBlockchain/BaseClient";
import { Constants } from "../src/Constants";

describe("Unit tests for BaseClient", () => {
  let credentials: ServiceClientCredentials;
  const baseClient = require("../src/ARMBlockchain/BaseClient");

  before(() => {
    credentials = {
      signRequest: () => undefined,
    };
  });

  beforeEach(() => {
    sinon.stub(baseClient.__proto__, "constructor");
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("constructor", () => {
    it("BaseClient was created.", async () => {
      // Arrange, Act
      const serviceClient = new baseClient.BaseClient(
        credentials,
        uuid.v4(),
        uuid.v4(),
        uuid.v4(),
        {} as msrestazure.AzureServiceClientOptions
      );

      // Assert
      assert.notStrictEqual(serviceClient, undefined, "serviceClient should not be undefined");
      assert.strictEqual(
        serviceClient.constructor.name,
        BaseClient.name,
        `serviceClient name should be equal to ${BaseClient.name}`
      );
    });

    describe("invalid subscriptionId", () => {
      const invalidSubscriptions = [String.Empty, null, undefined, ""];
      invalidSubscriptions.forEach(async (subscription) => {
        it(`BaseClient constructor throws error when subscriptionId is ${subscription}.`, async () => {
          // Arrange
          let serviceClient;

          // Act
          const action = () => {
            serviceClient = new baseClient.BaseClient(
              credentials,
              subscription,
              uuid.v4(),
              uuid.v4(),
              {} as msrestazure.AzureServiceClientOptions
            );
          };

          // Assert
          assert.throws(action, Error, Constants.errorMessageStrings.VariableShouldBeDefined("subscriptionId"));
          assert.strictEqual(serviceClient, undefined, "serviceClient should be undefined");
        });
      });
    });

    describe("invalid credentials", () => {
      const invalidCredentials = [null, undefined];
      invalidCredentials.forEach(async (credential) => {
        it(`BaseClient constructor throws error when credentials is ${credential}.`, async () => {
          // Arrange
          let serviceClient;

          // Act
          const action = () => {
            serviceClient = new baseClient.BaseClient(
              credential,
              uuid.v4(),
              uuid.v4(),
              uuid.v4(),
              {} as msrestazure.AzureServiceClientOptions
            );
          };

          // Assert
          assert.throws(action, Error, Constants.errorMessageStrings.VariableShouldBeDefined("credentials"));
          assert.strictEqual(serviceClient, undefined, "serviceClient should be undefined");
        });
      });
    });
  });
});
