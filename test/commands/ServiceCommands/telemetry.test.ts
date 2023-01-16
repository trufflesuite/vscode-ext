// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import assert from 'assert';
import {ItemType} from '@/Models/ItemType';
import {mapItemType} from '@/commands/ServiceCommands';

describe('ServiceCommands - Telemetry helper test', () => {
  [
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
  ].forEach((testItemType) => {
    it(`mapNetworkName should return correct result for network type '${testItemType.expectedResult}'`, () => {
      // Act
      const result = mapItemType(testItemType.itemType);

      // Assert
      assert.strictEqual(result, testItemType.expectedResult);
    });
  });
});
