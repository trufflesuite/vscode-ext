// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

const VARIABLE_REFERANCE = {
  all: 1,
  dynamicVariables: 2,
};

export const SCOPES = {
  all: {
    name: 'All',
    ref: VARIABLE_REFERANCE.all,
  },
  dynamicVariables: {
    ref: VARIABLE_REFERANCE.dynamicVariables,
  },
};

export const OBJECT_VARIABLE_DISPLAY_NAME = 'Object';
