// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import assert from "assert";
import fs from "fs-extra";
import path from "path";
import sinon from "sinon";
import {Constants} from "../src/Constants";
import {TruffleConfiguration} from "../src/helpers";
import * as helpers from "../src/helpers";
import * as commands from "../src/helpers/command";
import {ICommandResult} from "../src/helpers/command";
import * as testData from "./testData/truffleConfigTestdata";

describe("TruffleConfiguration helper", () => {
  afterEach(() => {
    sinon.restore();
  });

  it("generateMnemonic should return correct sequence", async () => {
    // Act
    const result = TruffleConfiguration.generateMnemonic();

    // Assert
    // 11 spaces + 12 words, 1 word = at least 1 char
    assert.strictEqual(result.length > 23, true, "result length should be greater than 23");
    assert.strictEqual(result.split(" ").length, 12, "number of words should be equal to 12");
  });

  it("getTruffleConfigUri returns correct value and check path for existence", async () => {
    // Arrange
    const referencePath = path.normalize("w:/temp/truffle-config.js");
    sinon.stub(helpers, "getWorkspaceRoot").returns(path.normalize("w:/temp"));
    const pathExistsStub = sinon.stub(fs, "pathExistsSync").returns(true);

    // Act
    const result = TruffleConfiguration.getTruffleConfigUri();

    // Assert
    assert.strictEqual(result, referencePath, "result should be correct uri");
    assert.strictEqual(pathExistsStub.calledOnce, true, "pathExists should called once");
  });

  it("getTruffleConfigUri throw an exception if path is not existed", async () => {
    // Arrange
    sinon.stub(helpers, "getWorkspaceRoot").returns("");
    sinon.stub(fs, "pathExistsSync").returns(false);

    // Act and Assert
    assert.throws(TruffleConfiguration.getTruffleConfigUri);
  });
});

describe("class TruffleConfig", () => {
  const configPathStub = path.normalize("w:/temp/truffle-config.js");
  let readFileStub: sinon.SinonStub<any, any>;
  let writeFileStub: sinon.SinonStub<any, any>;

  before(() => {
    readFileStub = sinon.stub(fs, "readFileSync");
    writeFileStub = sinon.stub(fs, "writeFileSync");

    readFileStub.withArgs(configPathStub).returns(testData.referenceCfgContent);
    readFileStub.withArgs("path").returns(testData.referenceMnemonic);
    readFileStub.withArgs("path", "encoding").returns(testData.referenceMnemonic);
  });

  after(() => {
    sinon.restore();
  });

  afterEach(() => {
    sinon.resetHistory();
  });

  it("getAST should load correct AST", async () => {
    // Arrange

    // Act
    const result = new TruffleConfiguration.TruffleConfig(configPathStub).getAST();

    // Assert
    assert.deepEqual(result, testData.referenceAstObject, "result should be equal to expected result");
    assert.strictEqual(readFileStub.callCount > 0, true, "readFile should called more then 0 times");
    assert.strictEqual(
      readFileStub.getCall(0).args[0],
      configPathStub,
      "readFile should called with correct arguments"
    );
  });

  it("writeAST should write ast content to file", async () => {
    // Arrange

    // Act
    const truffleConfig = new TruffleConfiguration.TruffleConfig(configPathStub);
    truffleConfig.getAST();
    truffleConfig.writeAST();

    // Assert
    assert.strictEqual(writeFileStub.callCount > 0, true, "writeFile should called more then 0 times");
    assert.strictEqual(
      writeFileStub.getCall(0).args[0],
      configPathStub,
      "writeFile should called with correct arguments"
    );
    assert.strictEqual(
      // 60 - first line, to avoid EOL differences
      writeFileStub.getCall(0).args[1].substring(0, 60),
      testData.referenceCfgContent.substring(0, 60),
      "writeFile should called with correct arguments"
    );
  });

  it("getNetworks should returns correct networks", async () => {
    // Arrange
    const truffleConfig = new TruffleConfiguration.TruffleConfig(configPathStub);

    // Act
    const result = truffleConfig.getNetworks();

    // Assert
    assert.deepStrictEqual(
      result[0],
      testData.referenceConfiguration.networks[0],
      "result first item should be equal to expected network"
    );
    assert.deepStrictEqual(
      result[1],
      testData.referenceConfiguration.networks[1],
      "result second item should be equal to expected network"
    );
  });

  it("setNetworks should add a network item", async () => {
    // Arrange
    const truffleConfig = new TruffleConfiguration.TruffleConfig(configPathStub);
    const newNetwork = {
      name: "newNetworkName",
      options: {
        network_id: "ntwrk",
      },
    };

    // Act
    const resultBefore = truffleConfig.getNetworks();
    truffleConfig.setNetworks(newNetwork);
    const resultAfter = truffleConfig.getNetworks();

    // Assert
    assert.strictEqual(resultBefore.length, 2, "before execution should be 2 networks");
    assert.strictEqual(resultAfter.length, 3, "after execution should be 2 networks");
    assert.deepStrictEqual(resultAfter[2], newNetwork, "last network should be equal to test network");
  });

  it("setNetworks should threw an exception if network already existed", async () => {
    // Arrange
    const truffleConfig = new TruffleConfiguration.TruffleConfig(configPathStub);
    const newNetwork = {
      name: "development",
      options: {
        network_id: "ntwrk",
      },
    };
    const action = () => {
      truffleConfig.setNetworks(newNetwork);
    };

    // Act and Assert
    assert.throws(action);
  });

  it("importFs should add correct import line", async () => {
    // Arrange
    const truffleConfig = new TruffleConfiguration.TruffleConfig(configPathStub);

    // Act
    truffleConfig.importPackage("fs", "fs");

    // Assert
    const configContent = writeFileStub.getCall(0).args[1];
    assert.strictEqual(configContent.includes("fs = require('fs');"), true, "configContent should include test string");
  });
});

describe("getConfiguration() in class TruffleConfig", () => {
  const configPathStub = path.normalize("w:/temp/truffle-config.js");
  let readFileStub: sinon.SinonStub<any, any>;

  beforeEach(() => {
    sinon.stub(helpers, "getWorkspaceRoot").returns(path.normalize("w:/temp"));

    readFileStub = sinon.stub(fs, "readFileSync");

    readFileStub.withArgs("path").returns(testData.referenceMnemonic);
    readFileStub.withArgs("path, encoding").returns(testData.referenceMnemonic);
  });

  afterEach(() => {
    sinon.restore();
  });

  it("getConfiguration returns configurations without directories and networks", async () => {
    // Arrange
    const {contracts_directory, contracts_build_directory, migrations_directory} =
      Constants.truffleConfigDefaultDirectory;
    const commandResult: ICommandResult = {
      cmdOutput: "",
      cmdOutputIncludingStderr: "",
      code: 0,
      messages: [{command: "truffleConfig", message: "{}"}],
    };

    sinon.stub(commands, "tryExecuteCommandInFork").returns(Promise.resolve(commandResult));
    readFileStub.returns("");
    const truffleConfig = new TruffleConfiguration.TruffleConfig(configPathStub);

    // Act
    const result = await truffleConfig.getConfiguration();

    // Assert
    assert.strictEqual(
      result.contracts_build_directory,
      path.normalize(contracts_build_directory),
      "result should contain contracts build directory"
    );
    assert.strictEqual(result.contracts_directory, contracts_directory, "result should contain contracts directory");
    assert.strictEqual(
      result.migrations_directory,
      migrations_directory,
      "result should contain migration build directory"
    );
    assert.strictEqual(result.networks?.length, 0, "result.networks should be empty array");
  });

  it("getConfiguration returns configurations with directories and without networks", async () => {
    // Arrange
    const expectedContractsBuildDirectory = "123";
    const expectedContractsDirectory = "234";
    const expectedMigrationsDirector = "345";

    const commandResult: ICommandResult = {
      cmdOutput: "",
      cmdOutputIncludingStderr: "",
      code: 0,
      messages: [
        {
          command: "truffleConfig",
          message:
            `{"contracts_build_directory": "${expectedContractsBuildDirectory}", ` +
            `"contracts_directory": "${expectedContractsDirectory}", ` +
            `"migrations_directory": "${expectedMigrationsDirector}"}`,
        },
      ],
    };

    sinon.stub(commands, "tryExecuteCommandInFork").returns(Promise.resolve(commandResult));
    readFileStub.returns("");
    const truffleConfig = new TruffleConfiguration.TruffleConfig(configPathStub);

    // Act
    const result = await truffleConfig.getConfiguration();

    // Assert
    assert.strictEqual(
      result.contracts_build_directory,
      expectedContractsBuildDirectory,
      "result should contain contracts build directory"
    );
    assert.strictEqual(
      result.contracts_directory,
      expectedContractsDirectory,
      "result should contain contracts directory"
    );
    assert.strictEqual(
      result.migrations_directory,
      expectedMigrationsDirector,
      "result should contain migration build directory"
    );
    assert.strictEqual(result.networks?.length, 0, "result.networks should be empty array");
  });

  it("getConfiguration returns configurations with networks", async () => {
    // Arrange
    const testNetworkOptions = '{"development":{"host":"127.0.0.1","port":8545,"network_id":"*"}}';
    const testNetwork = `{"networks": ${testNetworkOptions}}`;
    const parseTestNetworkOptions = JSON.parse(testNetworkOptions);

    const commandResult: ICommandResult = {
      cmdOutput: "",
      cmdOutputIncludingStderr: "",
      code: 0,
      messages: [{command: "truffleConfig", message: testNetwork}],
    };

    sinon.stub(commands, "tryExecuteCommandInFork").returns(Promise.resolve(commandResult));
    readFileStub.returns("");
    const truffleConfig = new TruffleConfiguration.TruffleConfig(configPathStub);

    // Act
    const result = await truffleConfig.getConfiguration();

    // Assert
    const networkKey = Object.keys(parseTestNetworkOptions)[0];
    assert.strictEqual(result.networks?.length, 1, "result.networks should not be empty array");
    assert.strictEqual(result.networks && result.networks[0].name, networkKey, "networks should have specific name");
    assert.deepStrictEqual(
      result.networks && result.networks[0].options,
      parseTestNetworkOptions[networkKey],
      "networks should have specific options"
    );
  });

  it("getConfiguration throws error when truffle-config.js has incorrect format", async () => {
    // Arrange
    const commandResult: ICommandResult = {
      cmdOutput: "",
      cmdOutputIncludingStderr: "",
      code: 0,
      messages: [{command: "truffleConfig", message: undefined}],
    };

    sinon.stub(commands, "tryExecuteCommandInFork").returns(Promise.resolve(commandResult));
    readFileStub.returns("");
    const truffleConfig = new TruffleConfiguration.TruffleConfig(configPathStub);

    // Act, Assert
    try {
      await truffleConfig.getConfiguration();
    } catch (error) {
      assert.strictEqual(
        (error as Error).message,
        Constants.errorMessageStrings.TruffleConfigHasIncorrectFormat,
        "getConfiguration should throw error"
      );
    }
  });
});
