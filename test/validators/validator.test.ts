// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as assert from 'assert';
import uuid = require('uuid');
import { Constants } from '../../src/Constants';
import { Validator } from '../../src/validators/validator';
import { TestConstants } from '../TestConstants';

describe('Validator', () => {
  describe('Unit test', () => {
    describe('check on specific chars and length', () => {
      const validationCharsTests = [
        {
          errorMessage: Constants.validationMessages.noLowerCaseLetter,
          maxLength: 20,
          message: 'has lower case',
          minLength: 5,
          testString: 'STR!NG123',
        },
        {
          errorMessage: Constants.validationMessages.noUpperCaseLetter,
          maxLength: 20,
          message: 'has upper case',
          minLength: 5,
          testString: 'str!ng123',
        },
        {
          errorMessage: Constants.validationMessages.noDigits,
          maxLength: 20,
          message: 'has digit',
          minLength: 5,
          testString: 'Str!ng',
        },
        {
          errorMessage: Constants.validationMessages.noSpecialChars,
          maxLength: 20,
          message: 'has special chars',
          minLength: 5,
          testString: 'String123',
        },
        {
          errorMessage: Constants.validationMessages.unresolvedSymbols(
            Constants.validationMessages.forbiddenChars.password),
          maxLength: 20,
          message: 'has not forbidden chars',
          minLength: 5,
          testString: 'Str!ng#/123',
        },
        {
          errorMessage: Constants.validationMessages.lengthRange(12, 72),
          maxLength: 72,
          message: 'not be short',
          minLength: 12,
          testString: 'Str!ng123',
        },
        {
          errorMessage: Constants.validationMessages.lengthRange(3, 8),
          maxLength: 8,
          message: 'not be long',
          minLength: 3,
          testString: 'Str!ng123',
        },
        {
          errorMessage: null,
          maxLength: 20,
          message: 'pass when all conditions are met',
          minLength: 5,
          testString: 'Str!ng123',
        },
      ];

      validationCharsTests.forEach((element: any) => {
        it(`should ${element.message}`, () => {
          // Act
          const result = new Validator(element.testString)
            .hasLowerCase()
            .hasUpperCase()
            .hasDigit()
            .hasSpecialChar(Constants.validationRegexps.specialChars.password)
            .hasNoForbiddenChar(
              Constants.validationRegexps.forbiddenChars.password,
              Constants.validationMessages.unresolvedSymbols(Constants.validationMessages.forbiddenChars.password))
            .inLengthRange(element.minLength, element.maxLength);

          // Assert
          assert.strictEqual(
            result.getErrors(),
            element.errorMessage,
            `validation result should be equal to "${element.errorMessage}"`);
        });
      });
    });

    describe('getErrors', () => {
      it('should return correct list of errors', () => {
        // Arrange
        const testString = 'string';

        // Act
        const result = new Validator(testString)
          .hasDigit()
          .hasUpperCase()
          .hasSpecialChar(Constants.validationRegexps.specialChars.password)
          .getErrors() as string;

        // Assert
        assert.strictEqual(
          result.includes(Constants.validationMessages.noDigits),
          true,
          `validation result should include message "${Constants.validationMessages.noDigits}"`);
        assert.strictEqual(
          result.includes(Constants.validationMessages.noUpperCaseLetter),
          true,
          `validation result should include message "${Constants.validationMessages.noUpperCaseLetter}"`);
        assert.strictEqual(
          result.includes(Constants.validationMessages.noSpecialChars),
          true,
          `validation result should include message "${Constants.validationMessages.noSpecialChars}"`);
      });
    });

    describe('isConfirmationValue', () => {
      it('should fail when string is not "yes" or "no"', () => {
        // Arrange
        const testString = uuid.v4();

        // Act
        const result = new Validator(testString).isConfirmationValue();

        // Assert
        assert.strictEqual(
          result.getErrors(),
          Constants.validationMessages.invalidConfirmationResult,
          `validation result should be equal to "${Constants.validationMessages.invalidConfirmationResult}"`);
      });

      TestConstants.testDialogAnswers.forEach((answer) => {
        it(`should pass when answer is ${answer}`, () => {
          // Act
          const result = new Validator(answer).isConfirmationValue();

          // Assert
          assert.strictEqual(result.getErrors(), null, 'validation result should be null');
        });
      });
    });

    describe('isLowerCase', () => {
      it('should fail when there is upper case letter', () => {
        // Arrange
        const testString = 'Str!ng123';

        // Act
        const result = new Validator(testString).isLowerCase();

        // Assert
        assert.strictEqual(
          result.getErrors(),
          Constants.validationMessages.onlyLowerCaseAllowed,
          `validation result should be equal to "${Constants.validationMessages.onlyLowerCaseAllowed}"`);
      });

      it('should pass when there are not upper case letters', () => {
        // Arrange
        const testString = 'str!ng123';

        // Act
        const result = new Validator(testString).isLowerCase();

        // Assert
        assert.strictEqual(result.getErrors(), null, 'validation result should be null');
      });
    });

    describe('isNotEmpty', () => {
      it('should fail when string is empty', () => {
        // Arrange
        const testString = '';

        // Act
        const result = new Validator(testString).isNotEmpty();

        // Assert
        assert.strictEqual(
          result.getErrors(),
          Constants.validationMessages.valueCannotBeEmpty,
          `validation result should be equal to "${Constants.validationMessages.valueCannotBeEmpty}"`);
      });

      it('should fail when string is white space', () => {
        // Arrange
        const testString = '  ';

        // Act
        const result = new Validator(testString).isNotEmpty();

        // Assert
        assert.strictEqual(
          result.getErrors(),
          Constants.validationMessages.valueCannotBeEmpty,
          `validation result should be equal to "${Constants.validationMessages.valueCannotBeEmpty}"`);
      });

      it('should pass when string is not empty', () => {
        // Arrange
        const testString = 'str!ng123';

        // Act
        const result = new Validator(testString).isNotEmpty();

        // Assert
        assert.strictEqual(result.getErrors(), null, 'validation result should be null');
      });
    });

    describe('isUrl', () => {
      it('should fail when string is not url', () => {
        // Arrange
        const testString = uuid.v4();

        // Act
        const result = new Validator(testString).isUrl();

        // Assert
        assert.strictEqual(
          result.getErrors(),
          Constants.validationMessages.invalidHostAddress,
          `validation result should be equal to "${Constants.validationMessages.invalidHostAddress}"`);
      });

      const validUrls = [
        'http://0.0.0.0',
        'https://0.0.0.0',
        'http://0.0.0.0:0',
        'https://0.0.0.0:0',
        '0.0.0.0',
        '0.0.0.0:0',
      ];

      validUrls.forEach((element) => {
        it(`should pass when string is correct url - "${element}"`, () => {
          // Act
          const result = new Validator(element).isUrl();

          // Assert
          assert.strictEqual(result.getErrors(), null, 'validation result should be null');
        });
      });
    });
  });
});
