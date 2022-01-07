// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

export class TestConstants {
  public static testError: string = "TestError";

  public static testMnemonic: string = "test test test test test test test test test test test test";

  public static testDialogAnswers: string[] = [
    "yes",
    "YES",
    "Yes",
    "YEs",
    "YeS",
    "yES",
    "yEs",
    "yeS",
    "no",
    "NO",
    "No",
    "nO",
  ];

  public static consortiumTestNames = {
    local: "localNetworkName",
  };

  public static servicesNames = {
    development: "development",
    localProject: "LocalProject",
    testConsortium: "testConsortium",
    testNetwork: "testNetwork",
  };

  public static truffleCommandTestDataFolder: string = "testData";
}
