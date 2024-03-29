// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import assert from 'assert';
import path from 'path';
import sinon from 'sinon';
import {debug, type QuickPickItem, workspace} from 'vscode';

import {DebugNetwork} from '@/debugAdapter/debugNetwork';
import type {ITransactionResponse} from '@/debugAdapter/models/ITransactionResponse';
import {TransactionProvider} from '@/debugAdapter/transaction/transactionProvider';

import * as userInteraction from '../../src/helpers/userInteraction';
import {TestConstants} from '../TestConstants';

import * as helpers from '@/helpers/workspace';
import {shortenHash} from '@/commands/DebuggerCommands';

const truffleWorkspace = new helpers.TruffleWorkspace(
  path.join(__dirname, TestConstants.truffleCommandTestDataFolder, 'truffle-config.js')
);

describe('DebuggerCommands mock tests', () => {
  let mockGetTxHashes: sinon.SinonStub<[(number | undefined)?], Promise<string[]>>;
  let mockGetTxInfos: sinon.SinonStub<[string[]], Promise<ITransactionResponse[]>>;
  let debugCommands: any;
  let getWorkspacesMock: sinon.SinonStub<
    Parameters<typeof helpers.getTruffleWorkspace>,
    Promise<helpers.TruffleWorkspace>
  >;

  beforeEach(() => {
    mockGetTxHashes = sinon.stub(TransactionProvider.prototype, 'getLastTransactionHashes');
    mockGetTxHashes.resolves([]);
    mockGetTxInfos = sinon.stub(TransactionProvider.prototype, 'getTransactionsInfo');
    mockGetTxInfos.resolves([]);

    getWorkspacesMock = sinon.stub(helpers, 'getTruffleWorkspace');
    getWorkspacesMock.returns(Promise.resolve(truffleWorkspace));

    sinon.stub(debug, 'startDebugging').resolves();
    sinon.stub(workspace, 'workspaceFolders').value([{uri: {fsPath: 'workspace'}}]);
    sinon.stub(DebugNetwork.prototype, 'load').resolves();
    sinon.stub(DebugNetwork.prototype, 'getTruffleConfiguration').returns({
      build_directory: '',
      contracts_build_directory: '',
      contracts_directory: '',
      migrations_directory: '',
    });
    sinon
      .stub(DebugNetwork.prototype, 'getNetwork')
      .returns({name: 'development', options: {host: '127.0.0.1', port: 8545, network_id: '*'}});

    debugCommands = require('../../src/commands/DebuggerCommands');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should `showinputBox` when no more txs', async () => {
    // Arrange
    const showInputBoxFn = sinon.stub(userInteraction, 'showInputBox').resolves('');

    // Act
    await debugCommands.DebuggerCommands.startSolidityDebugger();

    // Assert
    assert.strictEqual(mockGetTxHashes.calledOnce, true, 'getLastTransactionHashes should be called');
    assert.strictEqual(mockGetTxInfos.calledOnce, true, 'getTransactionsInfo should be called');
    assert.strictEqual(showInputBoxFn.called, true, 'showInputBox should be called');
  });

  it('should `showQuickPick` when there are more txs', async () => {
    // Arrange
    mockGetTxInfos.resolves([{hash: '0x1234', contractName: 'MetaCoin', methodName: 'constructor()'}]);
    const createQuickPickFn = sinon.stub(userInteraction, 'showQuickPick').resolves({} as QuickPickItem);

    // Act
    await debugCommands.DebuggerCommands.startSolidityDebugger();

    // Assert
    assert.strictEqual(mockGetTxHashes.calledOnce, true, 'getLastTransactionHashes should be called');
    assert.strictEqual(mockGetTxInfos.calledOnce, true, 'getTransactionsInfo should be called');
    assert.strictEqual(createQuickPickFn.called, true, 'createQuickPic should be called');
  });
});

describe('DebuggerCommands unit tests', () => {
  it('should `shortenHash` for a transaction hash', () => {
    assert.strictEqual(
      shortenHash('0xa50fda6a7e20710d5320cbe7f3a2f8ae9ffeee56fb50e5f0e68a2141d554d81e'),
      '0xa50f...d81e'
    );
    assert.strictEqual(
      shortenHash('0xa50fda6a7e20710d5320cbe7f3a2f8ae9ffeee56fb50e5f0e68a2141d554d81e', 2),
      '0xa5...1e'
    );
    assert.strictEqual(shortenHash('0xa50fda6a7e20710d5320cbe7f3a2f8ae9ffeee56fb50e5f0e68a2141d554d81e', 0), '0x...');
  });

  it('should `shortenHash` for an address hash', () => {
    assert.strictEqual(shortenHash('0xc448123202fda0547aa8587b496ea87fa479e7e8'), '0xc448...e7e8');
  });
});
