// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import * as assert from "assert";
import { Constants } from "../../src/Constants";
import { UrlValidator } from "../../src/validators/UrlValidator";
import { getRandomInt } from "../testHelpers/Random";

describe("UrlValidator", () => {
  describe("Unit test", () => {
    describe("validatePort", () => {
      const invalidPortList = ["", " ", "_", "a1/", "1a", "port", "0", "01", "65536"];

      const validPortList = [
        "1",
        "12",
        "123",
        "1234",
        "65535",
        getRandomInt(65535).toString(),
        getRandomInt(65535).toString(),
        getRandomInt(65535).toString(),
        getRandomInt(65535).toString(),
      ];

      invalidPortList.forEach((element: any) => {
        it(`port ${element} should be invalid`, () => {
          // Act
          const result = UrlValidator.validatePort(element);

          // Assert
          assert.strictEqual(
            result,
            Constants.validationMessages.invalidPort,
            `validation result should be equal to "${Constants.validationMessages.invalidPort}"`
          );
        });
      });

      validPortList.forEach((element: any) => {
        it(`port ${element} should be valid`, () => {
          // Act
          const result = UrlValidator.validatePort(element);

          // Assert
          assert.strictEqual(result, null, "validation result should be null");
        });
      });
    });

    describe("validateHostUrl", () => {
      const invalidUrlList = ["", " ", "_", "/a1", "http://localhost:1234", "https://localhost:1234", "localhost:1234"];

      const validUrlList = [
        "http://0.0.0.0",
        "https://0.0.0.0",
        "http://0.0.0.0:0",
        "https://0.0.0.0:0",
        "0.0.0.0",
        "0.0.0.0:0",
        `http://${getRandomInt(255)}.${getRandomInt(255)}.${getRandomInt(255)}.${getRandomInt(255)}`,
        `https://${getRandomInt(255)}.${getRandomInt(255)}.${getRandomInt(255)}.${getRandomInt(255)}`,
        `http://${getRandomInt(255)}.${getRandomInt(255)}.${getRandomInt(255)}.${getRandomInt(255)}:${65535}`,
        `https://${getRandomInt(255)}.${getRandomInt(255)}.${getRandomInt(255)}.${getRandomInt(255)}:${65535}`,
      ];

      invalidUrlList.forEach((element: any) => {
        it(`hostUrl ${element} should be invalid`, () => {
          // Act
          const result = UrlValidator.validateHostUrl(element);

          // Assert
          assert.notStrictEqual(result, null, "validation result should store list of errors");
        });
      });

      validUrlList.forEach((element: any) => {
        it(`hostUrl ${element} should be valid`, () => {
          // Act
          const result = UrlValidator.validateHostUrl(element);

          // Assert
          assert.strictEqual(result, null, "validation result should be equal null");
        });
      });
    });
  });
});
