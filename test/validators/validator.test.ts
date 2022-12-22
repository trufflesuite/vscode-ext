// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import assert from 'assert';
import {Constants} from '@/Constants';
import {INVALID_CONFIRMATION_RESULT, onlyLowerCaseAllowed, Validator} from '@/validators/validator';
import {TEST_DIALOG_ANSWERS} from './test-dialog-answers';

describe('validators::validator', () => {
  describe('Unit test', () => {
    describe('isConfirmationValue', () => {
      it('should fail when string is not "yes" or "no"', () => {
        // Arrange
        const testString = 'some string';

        // Act
        const result = new Validator(testString).isConfirmationValue();

        // Assert
        assert.strictEqual(
          result.getErrors(),
          INVALID_CONFIRMATION_RESULT,
          `validation result should be equal to "${INVALID_CONFIRMATION_RESULT}"`
        );
      });

      TEST_DIALOG_ANSWERS.forEach((answer) => {
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
          onlyLowerCaseAllowed,
          `validation result should be equal to "${onlyLowerCaseAllowed}"`
        );
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
          `validation result should be equal to "${Constants.validationMessages.valueCannotBeEmpty}"`
        );
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
          `validation result should be equal to "${Constants.validationMessages.valueCannotBeEmpty}"`
        );
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
        const testString = 'some other string';

        // Act
        const result = new Validator(testString).isUrl();

        // Assert
        assert.strictEqual(
          result.getErrors(),
          Constants.validationMessages.invalidHostAddress,
          `validation result should be equal to "${Constants.validationMessages.invalidHostAddress}"`
        );
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
