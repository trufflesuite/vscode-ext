// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import assert from "assert";
import rewire from "rewire";

describe("TreeManager tests", () => {
  const numberOfElements = 5;
  it(`fillDefaultTypes should return array with ${numberOfElements} elements`, async () => {
    // Arrange
    const treeManagerRewire = rewire("../src/services/tree/TreeManager");

    // Act
    const result = treeManagerRewire.TreeManager.__proto__.fillDefaultTypes([]);

    // Assert
    assert.strictEqual(
      result.length,
      numberOfElements,
      `fillDefaultTypes count should be equal to ${numberOfElements}`
    );
  });
});
