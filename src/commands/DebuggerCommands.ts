// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import path from 'path';
import {debug, DebugConfiguration, QuickPickItem, QuickPickItemKind, workspace} from 'vscode';

import {DEBUG_TYPE} from '@/debugAdapter/constants/debugAdapter';
import {DebugNetwork} from '@/debugAdapter/debugNetwork';
import {shortenHash} from '@/debugAdapter/functions';
import {TransactionProvider} from '@/debugAdapter/transaction/transactionProvider';
import {Web3Wrapper} from '@/debugAdapter/web3Wrapper';
import {getTruffleWorkspace, getPathByPlatform} from '@/helpers/workspace';
import {showInputBox, showQuickPick} from '@/helpers/userInteraction';
import {Telemetry} from '@/TelemetryClient';

const TX_REGEX = /^(?:0x)?[0-9a-fA-F]{64}$/;

export namespace DebuggerCommands {
  export async function startSolidityDebugger() {
    Telemetry.sendEvent('DebuggerCommands.startSolidityDebugger.commandStarted');

    const workspaceUri = (await getTruffleWorkspace()).workspace;
    const workingDirectory = getPathByPlatform(workspaceUri);
    const debugNetwork = new DebugNetwork(workingDirectory);
    await debugNetwork.load();
    const contractBuildDir = debugNetwork.getTruffleConfiguration()!.contracts_build_directory;

    const debugNetworkOptions = debugNetwork.getNetwork()!.options;
    const web3 = new Web3Wrapper(debugNetworkOptions);
    const providerUrl = web3.getProviderUrl();

    const workspaceFolder = workspace.getWorkspaceFolder(workspaceUri);

    if (debugNetwork.isLocalNetwork()) {
      // if local service then provide last transactions to choose
      const transactionProvider = new TransactionProvider(web3, contractBuildDir);
      const txHashesAsQuickPickItems = await getQuickPickItems(transactionProvider);

      const moreTxs = {
        label: '$(edit) Manually enter the transaction hash',
        detail: 'Note that if the target network is forked, an attempt will be made to fetch the source',
        alwaysShow: true,
      } as QuickPickItem;

      let txHashSelection;
      if (txHashesAsQuickPickItems.length > 0)
        txHashSelection = await showQuickPick(
          [...txHashesAsQuickPickItems, {kind: QuickPickItemKind.Separator, label: ''}, moreTxs],
          {
            ignoreFocusOut: true,
            placeHolder: 'Enter the transaction hash to debug',
          }
        );
      else {
        txHashSelection = moreTxs;
      }

      let txHash;
      if (txHashSelection === moreTxs) {
        txHash = await showInputBox({
          placeHolder: 'Type the transaction hash you want to debug (0x...)',
          validateInput: function (value: string) {
            const match = TX_REGEX.exec(value.trim());
            return match ? '' : 'The input does not look like a transaction, e.g., make sure it starts with `0x`';
          },
        });
      } else {
        txHash = txHashSelection.detail || txHashSelection.label;
      }

      const config = generateDebugAdapterConfig(txHash, workingDirectory, providerUrl);
      debug.startDebugging(workspaceFolder, config).then(() => {
        Telemetry.sendEvent('DebuggerCommands.startSolidityDebugger.commandFinished');
      });
    } else {
      // if remote network then require txHash
      const placeHolder = 'Type the transaction hash you want to debug (0x...)';
      const txHash = await showInputBox({placeHolder});
      if (txHash) {
        const config = generateDebugAdapterConfig(txHash, workingDirectory, providerUrl);
        debug.startDebugging(workspaceFolder, config).then(() => {
          Telemetry.sendEvent('DebuggerCommands.startSolidityDebugger.commandFinished');
        });
      }
    }
  }
}

async function getQuickPickItems(txProvider: TransactionProvider) {
  const txHashes = await txProvider.getLastTransactionHashes();
  const txInfos = await txProvider.getTransactionsInfo(txHashes);
  const lastTxsDeployed = txInfos.filter((tx) => tx.contractName !== '');

  return lastTxsDeployed.map((txInfo) => {
    const label = shortenHash(txInfo.hash);
    const description = generateDescription(txInfo.contractName, txInfo.methodName);
    return {alwaysShow: true, label, description, detail: txInfo.hash} as QuickPickItem;
  });
}

function generateDebugAdapterConfig(txHash: string, workingDirectory: string, providerUrl: string): DebugConfiguration {
  return {
    files: [],
    name: 'Debug Transactions',
    providerUrl,
    request: 'launch',
    txHash,
    type: DEBUG_TYPE,
    workingDirectory,
    timeout: 30000,
  } as DebugConfiguration;
}

// Migration.json, setComplete => Migration.setComplete()
function generateDescription(contractName?: string, methodName?: string) {
  const contractNameWithoutExt = path.basename(contractName || '', '.json');
  return `${contractNameWithoutExt}.${methodName}()`;
}
