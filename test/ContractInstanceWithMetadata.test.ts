// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import * as assert from "assert";
import * as fs from "fs-extra";
import * as path from "path";
import { ContractInstanceWithMetadata } from "../src/services";
import { Contract } from "../src/services/contract/Contract";

describe("ContractInstanceWithMetadata ExtractEnumsInfo tests", () => {
  const testContractFilePath = path.join(__dirname, "testData", "enumTestContract.json");

  it("ExtractEnumsInfo() does not throw exception", async () => {
    // Arrange
    const fileData = fs.readFileSync(testContractFilePath, "utf-8");
    const contract = new Contract(JSON.parse(fileData));

    // Act and Assert
    assert.doesNotThrow(() => {
      // @ts-ignore
      const instance = new ContractInstanceWithMetadata(contract, { id: "testNetworkKey" }, null);
    }, "ExtractEnumsInfo() failed the ContractInstance constructor");
  });

  describe("ExtractEnumsInfo() extracting a correct data", () => {
    let instance: ContractInstanceWithMetadata;
    const stateEnumCollection = [
      {
        name: "Request",
        value: 0,
      },
      {
        name: "Respond",
        value: 1,
      },
    ];
    const switcherEnumCollection = [
      {
        name: "On",
        value: 0,
      },
      {
        name: "Off",
        value: 1,
      },
    ];

    before(() => {
      const fileData = fs.readFileSync(testContractFilePath, "utf-8");
      const contract = new Contract(JSON.parse(fileData));
      instance = new ContractInstanceWithMetadata(contract, { id: "testNetworkKey" }, null);
    });

    it("methods parameters section", async () => {
      // Arrange
      const methodsCounter = 2;
      const sendRequestArgCounter = 1;
      const sendResponseArgCounter = 2;

      // Assert
      assert.strictEqual(
        Object.keys(instance.enumsInfo.methods).length,
        methodsCounter,
        "Not all methods are extracted from AST"
      );
      assert.strictEqual(
        Object.keys(instance.enumsInfo.methods.SendRequest).length,
        sendRequestArgCounter,
        "Not all arguments are extracted for SendRequest method"
      );
      assert.strictEqual(
        Object.keys(instance.enumsInfo.methods.SendResponse).length,
        sendResponseArgCounter,
        "Not all arguments are extracted for SendResponse method"
      );
      assert.deepStrictEqual(
        instance.enumsInfo.methods.SendRequest,
        { state: stateEnumCollection },
        "Arguments for SendRequest method are extracted incorrect"
      );
      assert.deepStrictEqual(
        instance.enumsInfo.methods.SendResponse,
        {
          flag: switcherEnumCollection,
          state: stateEnumCollection,
        },
        "Arguments for SendResponse method are extracted incorrect"
      );
    });

    it("contract fields section", async () => {
      // Assert
      assert.deepStrictEqual(
        instance.enumsInfo.fields,
        {
          Flag: switcherEnumCollection,
          State: stateEnumCollection,
        },
        "Fields of test contract are extracted incorrect"
      );
    });
  });
});
