// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

export function getLogicAppTemplate() {
  const value: { [key: string]: any; } = {};

  return {
    definition: {},
    parameters: {
      $connections: {
        value,
      },
    },
  };
}
