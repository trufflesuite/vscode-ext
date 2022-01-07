// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

export function getActionFlowAppTemplate() {
  return {
    inputs: {
      host: {
        apiId: "",
        connectionName: "",
        operationId: "",
      },
      parameters: {
        abi: {},
        contractAddress: "",
        functionName: "",
      } as { [key: string]: any },
    },
    runAfter: {},
    type: "OpenApiConnection",
  };
}
