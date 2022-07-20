// Copyright (c) 2022. Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Constants} from '@/Constants';
import sinon from 'sinon';
const should = require('chai').should();

import vscode from 'vscode';

describe('Integration Tests - SDK Core Commands', () => {
  before(async () => {
    //setup the mockery...
  });

  afterEach(() => {
    sinon.restore();
  });

  it.skip('will use TruffleCommands By Default.', async function () {
    //given - I have the default value set to goto truffle.
    const theKey = vscode.workspace.getConfiguration().inspect<string>(Constants.userSettings.coreSdkSettingsKey);

    // when I call the SDKCoreCommand

    // then the Truffle Instances will be called.

    // and the HH ones will not.

    should.fail(`incomplete: ${JSON.stringify(theKey)}`);
  });
  it.skip('will use TruffleCommands When Configured.', async function () {
    should.fail('incomplete');
  });
  it.skip('will use HardHatCommands When Configured.', async function () {
    should.fail('incomplete');
  });
});
