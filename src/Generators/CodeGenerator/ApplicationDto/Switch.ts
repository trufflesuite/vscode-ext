// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

export function getSwitchTemplate() {
  const cases: { [key: string]: any } = {};

  return {
    Switch: {
      cases,
      default: {
        actions: {
          DefaultResponse: {
            inputs: {
              body: "Method or state variable not found.",
              statusCode: 404,
            },
            kind: "Http",
            runAfter: {},
            type: "Response",
          },
        },
      },
      expression: "",
      runAfter: {},
      type: "Switch",
    },
  };
}
