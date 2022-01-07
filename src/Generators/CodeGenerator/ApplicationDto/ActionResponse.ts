// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

export function getActionResponseTemplate() {
  const runAfter: { [key: string]: any } = {};

  return {
    inputs: {
      body: "",
      statusCode: 200,
    },
    kind: "Http",
    runAfter,
    type: "Response",
  };
}
