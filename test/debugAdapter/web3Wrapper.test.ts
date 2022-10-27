// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import truffleProvider from '@truffle/provider';
import assert from 'assert';
import {restore, stub} from 'sinon';
import {INetworkOption} from '@/helpers/ConfigurationReader';
import {Web3Wrapper} from '@/debugAdapter/web3Wrapper';

describe('Web3Wrapper unit tests', () => {
  afterEach(() => {
    restore();
  });

  it('getProvider should call truffleProvider.create', () => {
    // Arrange
    const networkOptionsMock: INetworkOption = {
      host: '127.0.0.1',
      network_id: '*',
      port: 8545,
    };
    const truffleProviderCreateStub = stub(truffleProvider, 'create').returns({});

    // Act
    const web3Wrapper = new Web3Wrapper(networkOptionsMock);
    web3Wrapper.getProvider();

    assert.strictEqual(truffleProviderCreateStub.called, true, 'truffleProvider.create should be called');
  });
});
