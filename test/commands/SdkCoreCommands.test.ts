// Copyright (c) 2022. Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {sdkCoreCommands} from '@/commands';
import {Constants} from '@/Constants';
import {userSettings} from '@/helpers';
import {HardHatExtensionAdapter, TruffleExtensionAdapter} from '@/services/extensionAdapter';
import {expect} from 'chai'; // Using Expect style
import sinon, {SinonMock} from 'sinon';
import {Memento} from 'vscode';
import {FakeExtensionState} from '../FakeExtensionState';

describe('Integration Tests - SDK Core Commands', () => {
  const sandbox = sinon.createSandbox();

  const globalState: Memento = new FakeExtensionState({});

  let userSettingsMock: SinonMock;

  before(async () => {
    //setup the mockery...
    userSettingsMock = sinon.mock(userSettings);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('will use TruffleCommands By Default.', async function () {
    //given - I have the default value set to goto truffle.
    const theVal = Constants.coreSdk.truffle;
    userSettingsMock.expects('getConfiguration').returns({defaultValue: theVal, userValue: theVal});

    // when I call the SDKCoreCommand
    await sdkCoreCommands.initialize(globalState);

    // then the Truffle Instances will be called.
    expect(sdkCoreCommands.extensionAdapter).to.be.instanceof(TruffleExtensionAdapter);
  });

  it('will use TruffleCommands When Configured.', async function () {
    const theVal = Constants.coreSdk.truffle;
    userSettingsMock.expects('getConfiguration').returns({defaultValue: theVal, userValue: theVal});

    // when I call the SDKCoreCommand
    await sdkCoreCommands.initialize(globalState);

    // then the Truffle Instances will be called.
    expect(sdkCoreCommands.extensionAdapter).to.be.instanceof(TruffleExtensionAdapter);
  });
  it('will use HardHatCommands When Configured.', async function () {
    const theVal = Constants.coreSdk.hardhat;
    userSettingsMock.expects('getConfiguration').returns({defaultValue: theVal, userValue: theVal});

    // when I call the SDKCoreCommand
    await sdkCoreCommands.initialize(globalState);

    // then the Truffle Instances will be called.
    expect(sdkCoreCommands.extensionAdapter).to.be.instanceof(HardHatExtensionAdapter);
  });
});
