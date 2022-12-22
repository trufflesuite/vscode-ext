// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {mapNetworkName} from '@/commands/TruffleCommands';
import assert from 'assert';
import uuid from 'uuid';

describe('Telemetry helper test', () => {
  [
    {
      expectedResult: 'loc',
      name: 'development',
    },
    {
      expectedResult: 'inf',
      name: `inf_${uuid.v4()}`,
    },
    {
      expectedResult: 'loc',
      name: `loc_${uuid.v4()}`,
    },
    {
      expectedResult: 'other',
      name: `${uuid.v4()}`,
    },
  ].forEach((network) => {
    it(`mapNetworkName should return correct result for network '${network.name}'`, () => {
      // Act
      const result = mapNetworkName(network.name);

      // Assert
      assert.strictEqual(result, network.expectedResult);
    });
  });
});
