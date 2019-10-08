import * as assert from 'assert';
import * as sinon from 'sinon';
import { debug, window, workspace } from 'vscode';

import { DebugNetwork } from '../../src/debugAdapter/debugNetwork';
import { ITransactionResponse } from '../../src/debugAdapter/models/ITransactionResponse';
import { TransactionProvider } from '../../src/debugAdapter/transaction/transactionProvider';

describe('DebuggerCommands unit tests', () => {
  let mockGetTxHashes: sinon.SinonStub<[(number | undefined)?], Promise<string[]>>;
  let mockGetTxInfos: sinon.SinonStub<[string[]], Promise<ITransactionResponse[]>>;
  let debugCommands: any;

  beforeEach(() => {
    mockGetTxHashes = sinon.stub(TransactionProvider.prototype, 'getLastTransactionHashes');
    mockGetTxHashes.resolves([]);
    mockGetTxInfos = sinon.stub(TransactionProvider.prototype, 'getTransactionsInfo');
    mockGetTxInfos.resolves([]);

    sinon.stub(debug, 'startDebugging').resolves();
    sinon.stub(workspace, 'workspaceFolders').value([ { uri: { fsPath: 'workspace' }} ]);
    sinon.stub(DebugNetwork.prototype, 'load').resolves();
    sinon.stub(DebugNetwork.prototype, 'getTruffleConfiguration')
      .returns({ contracts_build_directory: 'ssssafd', contracts_directory: '', migrations_directory: '' });
    sinon.stub(DebugNetwork.prototype, 'getNetwork')
      .returns({ name: 'development', options: { host: '127.0.0.1', port: 8545, network_id: '*' } });

    debugCommands = require('../../src/commands/DebuggerCommands');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should generate quickpick when debugNetwork.isLocalNetwork() is true', async () => {
    // Arrange
    sinon.stub(DebugNetwork.prototype, 'isLocalNetwork').returns(true);
    const createQuickpickFn = sinon.spy(window, 'createQuickPick');

    // Act
    await debugCommands.DebuggerCommands.startSolidityDebugger();

    // Assert
    assert.strictEqual(mockGetTxHashes.calledOnce, true, 'getLastTransactionHashes should be called');
    assert.strictEqual(mockGetTxInfos.calledOnce, true, 'getTransactionsInfo should be called');
    assert.strictEqual(createQuickpickFn.called, true, 'createQuickPic should be called');
  });

  it('should show inputBox when debugNetwork.isLocalNetwork() is false', async () => {
    // Arrange
    sinon.stub(DebugNetwork.prototype, 'isLocalNetwork').returns(false);
    const showInputBoxFn = sinon.stub(window, 'showInputBox').resolves(undefined);

    // Act
    await debugCommands.DebuggerCommands.startSolidityDebugger();

    // Assert
    assert.strictEqual(showInputBoxFn.called, true, 'showInputBox should be called');
    assert.strictEqual(mockGetTxHashes.calledOnce, false, 'getLastTransactionHashes shouldn\'t be called');
    assert.strictEqual(mockGetTxInfos.calledOnce, false, 'getTransactionsInfo shouldn\'t be called');
  });
});
