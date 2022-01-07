// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

export function getActionLogicAppTemplate() {
  return {
    inputs: {
      body: {},
      host: {
        connection: {
          name: "",
        },
      },
      method: "post",
      path: "",
      queries: {
        abi: "",
        contractAddress: "",
      },
    },
    runAfter: {},
    type: "ApiConnection",
  };
}
