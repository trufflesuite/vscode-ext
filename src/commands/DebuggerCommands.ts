// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import path from 'path';
import {debug, type DebugConfiguration, type QuickPickItem, Uri, QuickPickItemKind, workspace} from 'vscode';

import {DEBUG_TYPE} from '@/debugAdapter/constants/debugAdapter';
import {DebugNetwork} from '@/debugAdapter/debugNetwork';
import {TransactionProvider} from '@/debugAdapter/transaction/transactionProvider';
import {Web3Wrapper} from '@/debugAdapter/web3Wrapper';
import {getTruffleWorkspace, getPathByPlatform} from '@/helpers/workspace';
import {showInputBox, showQuickPick} from '@/helpers/userInteraction';
import {Telemetry} from '@/Telemetry';
import type {DebuggerTypes} from '@/debugAdapter/models/debuggerTypes';

const TX_REGEX = /^(?:0x)?[0-9a-fA-F]{64}$/;

export namespace DebuggerCommands {
  export async function startSolidityDebugger(): Promise<void> {
    Telemetry.sendEvent('DebuggerCommands.startSolidityDebugger.commandStarted');

    const workspaceUri = (await getTruffleWorkspace()).workspace;
    const workingDirectory = getPathByPlatform(workspaceUri);
    const debugNetwork = new DebugNetwork(workingDirectory);
    await debugNetwork.load();
    const contractBuildDir = debugNetwork.getTruffleConfiguration()!.contracts_build_directory;

    const debugNetworkOptions = debugNetwork.getNetwork()!.options;
    const web3 = new Web3Wrapper(debugNetworkOptions);
    const providerUrl = web3.getProviderUrl();

    // if local service then provide last transactions to choose
    const transactionProvider = new TransactionProvider(web3, contractBuildDir);
    const txHashesAsQuickPickItems = await getQuickPickItems(transactionProvider);

    const moreTxs = {
      label: '$(edit) Manually enter the transaction hash (experimental)',
      detail: 'Note that if the target network is forked, an attempt will be made to fetch the source',
      alwaysShow: true,
    } as QuickPickItem;

    let txHashSelection;
    if (txHashesAsQuickPickItems.length > 0)
      txHashSelection = await showQuickPick(
        [...txHashesAsQuickPickItems, {kind: QuickPickItemKind.Separator, label: ''}, moreTxs],
        {
          ignoreFocusOut: true,
          placeHolder: 'Select the transaction hash to debug',
          // TODO: It would be nice to filter by contract's name and/or method name
          // matchOnDescription: true,
          // matchOnDetail: true,
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

    // Sets the parameters for the debug session
    const args = {
      txHash,
      workingDirectory,
      providerUrl,
      disableFetchExternal: false,
    };

    // Starts the debugger
    await startDebugging(args);
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

/**
 * Responsible for starting the Solidity debugger with the given arguments.
 * 
   @param args The `DebugArgs` to initialize the `DebugSession`.
 */
export async function startDebugging(args: DebuggerTypes.DebugArgs): Promise<void> {
  const workspaceFolder =
    args.workingDirectory === undefined ? undefined : workspace.getWorkspaceFolder(Uri.parse(args.workingDirectory));
  const config: DebugConfiguration & DebuggerTypes.ILaunchRequestArguments = {
    type: DEBUG_TYPE,
    name: 'Debug Transactions',
    request: 'launch',

    // TODO: are these `timeout` and `files` properties used?
    timeout: 30000,
    files: [],

    ...args,
  };

  debug.startDebugging(workspaceFolder, config).then(() => {
    Telemetry.sendEvent('DebuggerCommands.startSolidityDebugger.commandFinished');
  });
}

// Migration.json, setComplete => Migration.setComplete()
function generateDescription(contractName?: string, methodName?: string) {
  const contractNameWithoutExt = path.basename(contractName || '', '.json');
  return `${contractNameWithoutExt}.${methodName}()`;
}

/**
 * Shorten the checksummed version of the input `hash` to have `0x + chars ... chars` characters.
 * It assumes that `hash` starts with the prefix `0x`.
 *
 * > **NOTE**. _This is only `export`ed to be used in tests._
 *
 * @param hash the hash to shorten.
 * @param chars the desired length to append both at the start and at the end.
 * @returns the shortened `hash`.
 */
// ts-prune-ignore-next
export function shortenHash(hash: string, chars = 4): string {
  try {
    const parsed = hash;
    return `${parsed.substring(0, chars + 2)}...${parsed.substring(parsed.length - chars)}`;
  } catch (error) {
    throw Error(`Invalid 'address' parameter '${hash}'.`);
  }
}
