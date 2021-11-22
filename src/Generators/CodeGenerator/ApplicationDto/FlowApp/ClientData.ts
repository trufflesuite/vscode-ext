// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

export function getClientDataTemplate() {
  const connectionReferences: { [key: string]: any } = {};

  return {
    properties: {
      apiId: "/providers/Microsoft.PowerApps/apis/shared_logicflows",
      connectionReferences,
      definition: {},
      displayName: "",
    },
    schemaVersion: "1.0.0.0",
  };
}
