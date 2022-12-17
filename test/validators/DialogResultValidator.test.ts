// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {INVALID_CONFIRMATION_RESULT} from '@/validators/validator';
import assert from 'assert';
import {Constants} from '@/Constants';
import {DialogResultValidator} from '@/validators/DialogResultValidator';
import {TEST_DIALOG_ANSWERS} from './test-dialog-answers';

describe('validators::DialogResultValidator', () => {
  describe('Unit test', () => {
    describe('validateConfirmationResult', () => {
      it('should fail when result is empty', () => {
        // Arrange
        const testString = '';

        // Act
        const result = DialogResultValidator.validateConfirmationResult(testString) as string;

        // Assert
        assert.strictEqual(
          result.includes(Constants.validationMessages.valueCannotBeEmpty),
          true,
          `validation result should include message "${Constants.validationMessages.valueCannotBeEmpty}"`
        );
        assert.strictEqual(
          result.includes(INVALID_CONFIRMATION_RESULT),
          true,
          `validation result should include message "${INVALID_CONFIRMATION_RESULT}"`
        );
      });

      it('should fail when result different from yes or no', () => {
        // Arrange
        const testString = 'some string';

        // Act
        const result = DialogResultValidator.validateConfirmationResult(testString) as string;

        // Assert
        assert.strictEqual(
          result.includes(INVALID_CONFIRMATION_RESULT),
          true,
          `validation result should include message "${INVALID_CONFIRMATION_RESULT}"`
        );
      });

      TEST_DIALOG_ANSWERS.forEach((answer) => {
        it(`should pass when answer is ${answer}`, () => {
          // Act
          const result = DialogResultValidator.validateConfirmationResult(answer);

          // Assert
          assert.strictEqual(result, null, 'validation result should be null');
        });
      });
    });
  });
});
