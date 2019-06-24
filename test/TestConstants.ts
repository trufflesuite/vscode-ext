// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

export class TestConstants {
  public static testError: string = 'TestError';

  public static testShouldThrowError: string = 'Unexpected behaviour - should throw error';

  public static testMnemonic: string = 'test test test test test test test test test test test test';

  public static testDialogAnswers: string[] =
    ['yes', 'YES', 'Yes', 'YEs', 'YeS', 'yES', 'yEs', 'yeS', 'no', 'NO', 'No', 'nO'];

  public static consortiumTestNames = {
    local: 'localhost:1234',
    publicEthereum: 'publicEthereum',
    testEthereum: 'testEthereum',
  };

  public static networksNames = {
    azureBlockchainService: 'azureBlockchainService',
    development: 'development',
    ethereumNetwork: 'EthereumNetwork',
    ethereumTestnet: 'EthereumTestnet',
    localNetwork: 'LocalNetwork',
    testConsortium: 'testConsortium',
    testMainNetwork: 'testMainNetwork',
    testNetwork: 'testNetwork',
  };

  public static truffleCommandTestDataFolder: string = 'testData';
}
