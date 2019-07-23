// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as assert from 'assert';
import rewire = require('rewire');

describe('ConsortiumTreeManager tests', () => {
  it('defaultNetworksItems should return array with 4 elements', async () => {
    const treeManagerRewire = rewire('../src/treeService/ConsortiumTreeManager');
    const defaultNetworksItems = treeManagerRewire.__get__('defaultNetworksItems');

    const result = defaultNetworksItems();

    assert.strictEqual(result.length, 4, 'defaultNetworksItems count should be equal to 4');
  });
});
