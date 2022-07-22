// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import path from 'path';
import {debug, DebugConfiguration, QuickPickItem, workspace} from 'vscode';

import {DEBUG_TYPE} from '@/debugAdapter/constants/debugAdapter';
import {DebugNetwork} from '@/debugAdapter/debugNetwork';
import {shortenHash} from '@/debugAdapter/functions';
import {TransactionProvider} from '@/debugAdapter/transaction/transactionProvider';
import {Web3Wrapper} from '@/debugAdapter/web3Wrapper';
import {getWorkspace} from '@/helpers';
import {showInputBox, showQuickPick} from '@/helpers/userInteraction';
import {getPathByPlatform} from '@/helpers/workspace';
import {Telemetry} from '@/TelemetryClient';

export namespace DebuggerCommands {
  export async function startSolidityDebugger() {
    Telemetry.sendEvent('DebuggerCommands.startSolidityDebugger.commandStarted');

    const workspaceUri = await getWorkspace();
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

      const txHashSelection = await showQuickPick(txHashesAsQuickPickItems, {
        ignoreFocusOut: true,
        placeHolder: 'Enter the transaction hash to debug',
      });

      const txHash = txHashSelection.detail || txHashSelection.label;
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

  return txInfos.map((txInfo) => {
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
