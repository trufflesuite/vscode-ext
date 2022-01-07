// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import { Constants, RequiredApps } from "../../Constants";
import { tryExecuteCommandAsync } from "../../helpers/command";
import { Telemetry } from "../../TelemetryClient";

export default async function calculateHash(filePath: string): Promise<string> {
  const calculateHashCommand = "hash-object";
  const calculateHashProcess = await tryExecuteCommandAsync(
    undefined,
    false,
    RequiredApps.git,
    calculateHashCommand,
    `"${filePath}"`
  ).result;

  if (calculateHashProcess.code !== 0) {
    const error = new Error(
      Constants.openZeppelin.hashCalculationFailed(Telemetry.obfuscate(calculateHashProcess.cmdOutputIncludingStderr))
    );

    Telemetry.sendException(error);
    throw error;
  }

  // git hash-object sends "hash[new_line_symbol]" to output. We need to remove new line
  return calculateHashProcess.cmdOutput.replace(/\r\n|\n|\r$/, "");
}
