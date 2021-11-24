// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import * as assert from "assert";
import rewire = require("rewire");
import sinon = require("sinon");
import { Constants } from "../../src/Constants";
import { AzureBlockchainServiceValidator } from "../../src/validators/AzureBlockchainServiceValidator";

const { azureBlockchainResourceName, password, resourceGroup } = Constants.lengthParam;
``;
describe("AzureBlockchain Service Validator", () => {
  const emptyValues = ["", " "];
  const {
    valueCannotBeEmpty,
    noLowerCaseLetter,
    noUpperCaseLetter,
    noDigits,
    noSpecialChars,
    lengthRange,
    unresolvedSymbols,
    forbiddenChars,
    invalidResourceGroupName,
    invalidAzureName,
  } = Constants.validationMessages;

  describe("Unit tests", () => {
    describe("accessPasswordValidator", () => {
      emptyValues.forEach((testPassword) => {
        it(`returns error message when password is empty: '${testPassword}'`, async () => {
          // Arrange, Act
          const result = (await AzureBlockchainServiceValidator.validateAccessPassword(testPassword)) as string;

          // Assert
          assert.strictEqual(result.includes(valueCannotBeEmpty), true, "empty password should be invalid");
        });
      });

      it("returns error message when password has no lower case letter", async () => {
        // Arrange
        const invalidPassword = "AAAAAA111!!!";

        // Act
        const result = await AzureBlockchainServiceValidator.validateAccessPassword(invalidPassword);

        // Assert
        assert.strictEqual(result, noLowerCaseLetter, "password without lower case should be invalid");
      });

      it("returns error message when password has no upper case letter", async () => {
        // Arrange
        const invalidPassword = "aaaaaa111!!!";

        // Act
        const result = await AzureBlockchainServiceValidator.validateAccessPassword(invalidPassword);

        // Assert
        assert.strictEqual(result, noUpperCaseLetter, "password without upper case should be invalid");
      });

      it("returns error message when password has no digit", async () => {
        // Arrange
        const invalidPassword = "AAAaaaAAA!!!";

        // Act
        const result = await AzureBlockchainServiceValidator.validateAccessPassword(invalidPassword);

        // Assert
        assert.strictEqual(result, noDigits, "password without digit should be invalid");
      });

      it("returns error message when password has no special char", async () => {
        // Arrange
        const invalidPassword = "AAAaaa111222";

        // Act
        const result = await AzureBlockchainServiceValidator.validateAccessPassword(invalidPassword);

        // Assert
        assert.strictEqual(result, noSpecialChars, "password without special char should be invalid");
      });

      it("returns error message when password has forbidden char", async () => {
        // Arrange
        const invalidPassword = "AAAaaa111!!!*";

        // Act
        const result = await AzureBlockchainServiceValidator.validateAccessPassword(invalidPassword);

        // Assert
        assert.strictEqual(
          result,
          unresolvedSymbols(forbiddenChars.password),
          "password with forbidden char should be invalid"
        );
      });

      const invalidPasswordLengthList = [password.min - 1, password.max + 1];

      invalidPasswordLengthList.forEach((length) => {
        it(`returns error message when password has invalid length: '${length}'`, async () => {
          // Arrange
          const mainSymbols = "Aa1!";
          mainSymbols.repeat(25);
          const invalidPassword = mainSymbols.substr(0, length);

          // Act
          const result = await AzureBlockchainServiceValidator.validateAccessPassword(invalidPassword);

          // Assert
          assert.strictEqual(
            result,
            lengthRange(password.min, password.max),
            `password with length: ${length} should be invalid`
          );
        });
      });

      it("error contains several messages when several requirements failed", async () => {
        // Arrange
        const invalidPassword = "A;";

        // Act
        const result = (await AzureBlockchainServiceValidator.validateAccessPassword(invalidPassword)) as string;

        // Assert
        assert.strictEqual(result.includes(noLowerCaseLetter), true, "error should have lower case message");
        assert.strictEqual(result.includes(noDigits), true, "error should have digits message");
        assert.strictEqual(result.includes(noSpecialChars), true, "error should have special chars message");
        assert.strictEqual(
          result.includes(unresolvedSymbols(forbiddenChars.password)),
          true,
          "error should have forbidden chars message"
        );
        assert.strictEqual(
          result.includes(lengthRange(password.min, password.max)),
          true,
          "error should have length message"
        );
      });
    });

    describe("validateResourceGroupName", () => {
      let azureBlockchainValidator: any;

      before(() => {
        azureBlockchainValidator = rewire("../../src/validators/AzureBlockchainServiceValidator");
      });

      emptyValues.forEach((testResourceGroup) => {
        it(`returns error message when resource group name (${testResourceGroup}) is empty`, async () => {
          // Arrange, Act
          const result = await azureBlockchainValidator.AzureBlockchainServiceValidator.validateResourceGroupName(
            testResourceGroup,
            {
              checkExistence: sinon.stub().returns(Promise.resolve(true)),
            }
          );

          // Assert
          assert.strictEqual(result, invalidResourceGroupName, "empty resource group name should be invalid");
        });
      });

      const resourceGroupHasDotAtTheEndList = [".", "a."];

      resourceGroupHasDotAtTheEndList.forEach((name) => {
        it(`returns error message when resource group name ('${name}') ends with dot`, async () => {
          // Arrange, Act
          const result = await azureBlockchainValidator.AzureBlockchainServiceValidator.validateResourceGroupName(
            name,
            {
              checkExistence: sinon.stub().returns(Promise.resolve(true)),
            }
          );

          // Assert
          assert.strictEqual(
            result,
            invalidResourceGroupName,
            "resource group name with dot at the end should be invalid"
          );
        });
      });

      const resourceGroupHasUnavailableSymbolList = ["!", "@"];

      resourceGroupHasUnavailableSymbolList.forEach((name) => {
        it(`returns error message when resource group name ('${name}') has unavailable symbols`, async () => {
          // Arrange, Act
          const result = await azureBlockchainValidator.AzureBlockchainServiceValidator.validateResourceGroupName(
            name,
            {
              checkExistence: sinon.stub().returns(Promise.resolve(true)),
            }
          );

          // Assert
          assert.strictEqual(
            result,
            invalidResourceGroupName,
            "resource group name with unavailable symbols should be invalid"
          );
        });
      });

      const resourceGroupLengthList = [resourceGroup.min - 1, resourceGroup.max + 1];

      resourceGroupLengthList.forEach((length) => {
        it(`returns error message when resource group name has invalid length: '${length}'`, async () => {
          // Arrange
          const mainSymbols = "a";
          const invalidResourceGroup = mainSymbols.repeat(resourceGroup.max + 1);

          // Act
          const result = await azureBlockchainValidator.AzureBlockchainServiceValidator.validateResourceGroupName(
            invalidResourceGroup,
            {
              checkExistence: sinon.stub().returns(Promise.resolve(true)),
            }
          );

          // Assert
          assert.strictEqual(
            result,
            invalidResourceGroupName,
            `resource group name length: ${length} should be invalid`
          );
        });
      });

      it("returns error messages when resource group name is alreasy exist", async () => {
        // Arrange
        const existingResourceGroupName = "resourceGroupName";

        // Act
        const result = await azureBlockchainValidator.AzureBlockchainServiceValidator.validateResourceGroupName(
          existingResourceGroupName,
          {
            checkExistence: sinon.stub().returns(
              Promise.resolve({
                message: null,
                nameAvailable: false,
                reason: Constants.responseReason.alreadyExists,
              })
            ),
          }
        );

        // Assert
        assert.strictEqual(
          result,
          Constants.validationMessages.resourceGroupAlreadyExists(existingResourceGroupName),
          "resource group name should be exist"
        );
      });

      const validResourceGroupNameList = ["-", "_", "(", ")", "1", "rg", "RG", "a.a", ".a"];

      validResourceGroupNameList.forEach((name) => {
        it(`resource group name (${name}) should be valid`, async () => {
          // Arrange, Act
          const result = await azureBlockchainValidator.AzureBlockchainServiceValidator.validateResourceGroupName(
            name,
            {
              checkExistence: sinon.stub().returns(Promise.resolve(false)),
            }
          );

          // Assert
          assert.strictEqual(result, null, "resource group name should be valid");
        });
      });

      const resourceGroupHasValidLengthList = [resourceGroup.min, resourceGroup.max];

      resourceGroupHasValidLengthList.forEach((length) => {
        it(`resource group name should be valid with length: ${length}`, async () => {
          // Arrange
          const mainSymbols = "a";
          const validResourceGroup = mainSymbols.repeat(length);

          // Act
          const result = await azureBlockchainValidator.AzureBlockchainServiceValidator.validateResourceGroupName(
            validResourceGroup,
            {
              checkExistence: sinon.stub().returns(Promise.resolve(false)),
            }
          );

          // Assert
          assert.strictEqual(result, null, `resource group name should be valid with length: ${length}`);
        });
      });
    });

    describe("validateAzureBlockchainResourceName", () => {
      let azureBlockchainValidator: any;

      before(() => {
        azureBlockchainValidator = rewire("../../src/validators/AzureBlockchainServiceValidator");
      });

      emptyValues.forEach((consortiumName) => {
        it(`returns error message when consortium name (${consortiumName}) is empty`, async () => {
          // Arrange, Act
          const result =
            await azureBlockchainValidator.AzureBlockchainServiceValidator.validateAzureBlockchainResourceName(
              consortiumName,
              {
                checkExistence: sinon.stub().returns(Promise.resolve(true)),
              }
            );

          // Assert
          assert.strictEqual(result, invalidAzureName, "empty consortium name should be invalid");
        });
      });

      const consortiumNameLengthList = [azureBlockchainResourceName.min - 1, azureBlockchainResourceName.max + 1];

      consortiumNameLengthList.forEach((length) => {
        it(`returns error message when consortium name has invalid length: '${length}'`, async () => {
          // Arrange
          const mainSymbols = "a";
          const invalidConsortiumName = mainSymbols.repeat(length);

          // Act
          const result =
            await azureBlockchainValidator.AzureBlockchainServiceValidator.validateAzureBlockchainResourceName(
              invalidConsortiumName,
              {
                checkExistence: sinon.stub().returns(Promise.resolve(false)),
              }
            );

          // Assert
          assert.strictEqual(result, invalidAzureName, `consortium name length: ${length} should be invalid`);
        });
      });

      const consortiumNameWithUpperCaseLetterList = ["aA", "Aa"];

      consortiumNameWithUpperCaseLetterList.forEach((name) => {
        it(`returns error message when consortium name ('${name}') has upper case letter`, async () => {
          // Arrange, Act
          const result =
            await azureBlockchainValidator.AzureBlockchainServiceValidator.validateAzureBlockchainResourceName(name, {
              checkExistence: sinon.stub().returns(Promise.resolve(false)),
            });

          // Assert
          assert.strictEqual(result, invalidAzureName, "consortium name with upper case should be invalid");
        });
      });

      const consortiumNameDigitAtFirstPlaceList = ["1a", "11"];

      consortiumNameDigitAtFirstPlaceList.forEach((name) => {
        it(`returns error message when consortium name ('${name}') has digit at first place`, async () => {
          // Arrange, Act
          const result =
            await azureBlockchainValidator.AzureBlockchainServiceValidator.validateAzureBlockchainResourceName(name, {
              checkExistence: sinon.stub().returns(Promise.resolve(false)),
            });

          // Assert
          assert.strictEqual(result, invalidAzureName, "consortium name with digit at first place should be invalid");
        });
      });

      it("returns error message when consortium name has unavailable symbols", async () => {
        // Arrange
        const invalidConsortiumName = "aa!";

        // Act
        const result =
          await azureBlockchainValidator.AzureBlockchainServiceValidator.validateAzureBlockchainResourceName(
            invalidConsortiumName,
            {
              checkExistence: sinon.stub().returns(Promise.resolve(false)),
            }
          );

        // Assert
        assert.strictEqual(result, invalidAzureName, "consortium name with unavailable symbols should be invalid");
      });

      const validConsortiumNames = [
        "aa",
        "a1",
        "a1a",
        "a".repeat(azureBlockchainResourceName.max),
        "a".repeat(azureBlockchainResourceName.min),
      ];

      validConsortiumNames.forEach((name) => {
        it(`consortium name (${name}) should be valid`, async () => {
          // Arrange, Act
          const result =
            await azureBlockchainValidator.AzureBlockchainServiceValidator.validateAzureBlockchainResourceName(name, {
              checkExistence: sinon.stub().returns(
                Promise.resolve({
                  message: null,
                  nameAvailable: true,
                  reason: "",
                })
              ),
            });

          // Assert
          assert.strictEqual(result, null, "consortium name should be valid");
        });
      });
    });

    describe("validateAzureBlockchainResourceName", () => {
      let azureBlockchainValidator: any;

      before(() => {
        azureBlockchainValidator = rewire("../../src/validators/AzureBlockchainServiceValidator");
      });

      emptyValues.forEach((memberName) => {
        it(`returns error message when member name (${memberName}) is empty`, async () => {
          // Arrange,  Act
          const result =
            await azureBlockchainValidator.AzureBlockchainServiceValidator.validateAzureBlockchainResourceName(
              memberName,
              {
                checkExistence: sinon.stub().returns(Promise.resolve(true)),
              }
            );

          // Assert
          assert.strictEqual(result, invalidAzureName, "empty member name should be invalid");
        });
      });

      const memberNameLengthList = [azureBlockchainResourceName.min - 1, azureBlockchainResourceName.max + 1];

      memberNameLengthList.forEach((length) => {
        it(`returns error message when member name has invalid length: '${length}'`, async () => {
          // Arrange
          const mainSymbols = "a";
          const invalidMemberName = mainSymbols.repeat(length);

          // Act
          const result =
            await azureBlockchainValidator.AzureBlockchainServiceValidator.validateAzureBlockchainResourceName(
              invalidMemberName,
              {
                checkExistence: sinon.stub().returns(Promise.resolve(false)),
              }
            );

          // Assert
          assert.strictEqual(result, invalidAzureName, `member name length: ${length} should be invalid`);
        });
      });

      const memberNameWithUpperCaseLetterList = ["aA", "Aa"];

      memberNameWithUpperCaseLetterList.forEach((name) => {
        it(`returns error message when member name ('${name}') has upper case letter`, async () => {
          // Arrange, Act
          const result =
            await azureBlockchainValidator.AzureBlockchainServiceValidator.validateAzureBlockchainResourceName(name, {
              checkExistence: sinon.stub().returns(Promise.resolve(false)),
            });

          // Assert
          assert.strictEqual(result, invalidAzureName, "member name with upper case should be invalid");
        });
      });

      const memberNameDigitAtFirstPlaceList = ["1a", "11"];

      memberNameDigitAtFirstPlaceList.forEach((name) => {
        it(`returns error message when member name ('${name}') has digit at first place`, async () => {
          // Arrange, Act
          const result =
            await azureBlockchainValidator.AzureBlockchainServiceValidator.validateAzureBlockchainResourceName(name, {
              checkExistence: sinon.stub().returns(Promise.resolve(false)),
            });

          // Assert
          assert.strictEqual(result, invalidAzureName, "member name with digit at first place should be invalid");
        });
      });

      it("returns error message when member name has unavailable symbols", async () => {
        // Arrange
        const invalidMemberName = "aa!";

        // Act
        const result =
          await azureBlockchainValidator.AzureBlockchainServiceValidator.validateAzureBlockchainResourceName(
            invalidMemberName,
            {
              checkExistence: sinon.stub().returns(Promise.resolve(false)),
            }
          );

        // Assert
        assert.strictEqual(result, invalidAzureName, "member name with unavailable symbols should be invalid");
      });

      const validMemberNames = [
        "aa",
        "a1",
        "a1a",
        "a".repeat(azureBlockchainResourceName.max),
        "a".repeat(azureBlockchainResourceName.min),
      ];

      validMemberNames.forEach((name) => {
        it(`member name (${name}) should be valid`, async () => {
          // Arrange, Act
          const result =
            await azureBlockchainValidator.AzureBlockchainServiceValidator.validateAzureBlockchainResourceName(name, {
              checkExistence: sinon.stub().returns(
                Promise.resolve({
                  message: null,
                  nameAvailable: true,
                  reason: "",
                })
              ),
            });

          // Assert
          assert.strictEqual(result, null, "member name should be valid");
        });
      });
    });
  });
});
