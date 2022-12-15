// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import assert from 'assert';
import uuid from 'uuid';
import {mapItemType, mapNetworkName} from '@/helpers/telemetry';
import {ItemType} from '@/Models';

describe('Telemetry helper test', () => {
  const testNetworks = [
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
  ];

  testNetworks.forEach((network) => {
    it(`mapNetworkName should return correct result for network '${network.name}'`, () => {
      // Act
      const result = mapNetworkName(network.name);

      // Assert
      assert.strictEqual(result, network.expectedResult);
    });
  });

  const testItemTypes = [
    {
      expectedResult: 'loc',
      itemType: ItemType.LOCAL_PROJECT,
    },
    {
      expectedResult: 'inf',
      itemType: ItemType.INFURA_PROJECT,
    },
    {
      expectedResult: 'other',
      itemType: ItemType.MEMBER,
    },
  ];

  testItemTypes.forEach((testItemType) => {
    it(`mapNetworkName should return correct result for network type '${testItemType.expectedResult}'`, () => {
      // Act
      const result = mapItemType(testItemType.itemType);

      // Assert
      assert.strictEqual(result, testItemType.expectedResult);
    });
  });
});
