// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

export class TestConstants {
  public static testError = 'TestError';

  public static testMnemonic = 'test test test test test test test test test test test test';

  public static testDialogAnswers: string[] = [
    'yes',
    'YES',
    'Yes',
    'YEs',
    'YeS',
    'yES',
    'yEs',
    'yeS',
    'no',
    'NO',
    'No',
    'nO',
  ];

  public static servicesNames = {
    development: 'development',
    localProject: 'LocalProject',
    testNetwork: 'testNetwork',
  };

  public static networkNames = {
    local: 'development',
  };

  public static truffleCommandTestDataFolder = 'testData';
}
