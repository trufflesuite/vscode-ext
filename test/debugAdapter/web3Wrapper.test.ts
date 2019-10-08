import * as assert from 'assert';
import * as sinon from 'sinon';
import * as truffleProvider from 'truffle-provider';
import { ConfigurationReader } from '../../src/debugAdapter/configurationReader';
import { Web3Wrapper } from '../../src/debugAdapter/web3Wrapper';

describe('Web3Wrapper unit tests', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('getProvider should call truffleProvider.create', () => {
    // Arrange
    const networkOptionsMock: ConfigurationReader.INetworkOption = {
        host: '127.0.0.1', network_id: '*', port: 8545,
    };
    const truffleProviderCreateStub = sinon.stub(truffleProvider, 'create')
      .returns({});

    // Act
    const web3Wrapper = new Web3Wrapper(networkOptionsMock);
    web3Wrapper.getProvider();

    assert.strictEqual(truffleProviderCreateStub.called, true, 'truffleProvider.create should be called');
  });
});
