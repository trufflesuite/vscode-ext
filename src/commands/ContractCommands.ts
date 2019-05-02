// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { UiServer } from '../UiServer';

export namespace ContractCommands {
  export async function generateSmartContractUI(): Promise<void> {
    return UiServer.startServer();
  }
}
