// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as assert from 'assert';
import uuid = require('uuid');
import { Constants } from '../../src/Constants';
import { DialogResultValidator } from '../../src/validators/DialogResultValidator';
import { TestConstants } from '../TestConstants';

describe('DialogResultValidator', () => {
  describe('Unit test', () => {
    describe('validateConfirmationResult', () => {
      it('should fail when result is empty', () => {
        // Arrange
        const testString = '';

        // Act
        const result = DialogResultValidator.validateConfirmationResult(testString) as string;

        // Assert
        assert.strictEqual(result.includes(Constants.validationMessages.valueCannotBeEmpty), true);
        assert.strictEqual(result.includes(Constants.validationMessages.invalidConfirmationResult), true);
      });

      it('should fail when result different from yes or no', () => {
        // Arrange
        const testString = uuid.v4();

        // Act
        const result = DialogResultValidator.validateConfirmationResult(testString) as string;

        // Assert
        assert.strictEqual(result.includes(Constants.validationMessages.invalidConfirmationResult), true);
      });

      TestConstants.testDialogAnswers.forEach((answer) => {
        it(`should pass when answer is ${answer}`, () => {
          // Act
          const result = DialogResultValidator.validateConfirmationResult(answer);

          // Assert
          assert.strictEqual(result, null);
        });
      });
    });
  });
});
