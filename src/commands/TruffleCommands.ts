// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as fs from 'fs-extra';
import * as path from 'path';
import { format } from 'url';
import { env, ProgressLocation, Uri, window } from 'vscode';
import { Constants } from '../Constants';
import {
  getWorkspaceRoot,
  outputCommandHelper,
  required,
  showConfirmPaidOperationDialog,
  showQuickPick,
  TruffleConfig,
  TruffleConfiguration,
} from '../helpers';
import { Consortium, MainNetworkConsortium } from '../Models';
import { Output } from '../Output';
import { ConsortiumTreeManager } from '../treeService/ConsortiumTreeManager';
import { ConsortiumCommands } from './ConsortiumCommands';
import { GanacheCommands } from './GanacheCommands';

interface IDeployDestination {
  cmd: () => Promise<void>;
  cwd?: string;
  description?: string;
  detail?: string;
  label: string;
  networkId: string | number;
  consortiumId?: number;
}

const localGanacheRegexp = new RegExp(`127\.0\.0\.1\:${Constants.defaultLocalhostPort}`, 'g');

export namespace TruffleCommands {
  export async function buildContracts(): Promise<void> {
    await window.withProgress({
      location: ProgressLocation.Window,
      title: Constants.statusBarMessages.buildingContracts,
    }, async () => {
		if (!await required.checkAppsSilent(required.Apps.truffle)) {
		  await required.installTruffle(required.Scope.locally);
		}

      try {
        Output.show();
        await outputCommandHelper.executeCommand(getWorkspaceRoot(), 'npx', 'truffle', 'compile');
      } catch (error) {
        throw Error(error);
      }
    });
  }

  export async function deployContracts(consortiumTreeManager: ConsortiumTreeManager): Promise<void> {
    if (!await required.checkAppsSilent(required.Apps.truffle)) {
      await required.installTruffle(required.Scope.locally);
    }

    const truffleConfigsUri = TruffleConfiguration.getTruffleConfigUri();
    const defaultDeployDestinations = await getDefaultDeployDestinations(truffleConfigsUri, consortiumTreeManager);
    const truffleDeployDestinations = await getTruffleDeployDestinations(truffleConfigsUri);
    const consortiumDeployDestinations = await getConsortiumDeployDestinations(
      truffleConfigsUri,
      consortiumTreeManager,
    );

    const deployDestinations: IDeployDestination[] = [];
    deployDestinations.push(...defaultDeployDestinations);
    deployDestinations.push(...truffleDeployDestinations);
    deployDestinations.push(...consortiumDeployDestinations);

    return execute(deployDestinations.filter((destination, index, self) => {
      if (!destination.consortiumId) {
        return true;
      }
      return self.findIndex((dest) => dest.consortiumId === destination.consortiumId) === index;
    }));
  }

  export async function writeAbiToBuffer(uri: Uri): Promise<void> {
    const contract = await readCompiledContract(uri);

    env.clipboard.writeText(JSON.stringify(contract[Constants.contractProperties.abi]));
  }

  export async function writeBytecodeToBuffer(uri: Uri): Promise<void> {
    const contract = await readCompiledContract(uri);

    env.clipboard.writeText(contract[Constants.contractProperties.bytecode]);
  }

  export async function acquireCompiledContractUri(uri: Uri): Promise<Uri> {
    if (path.extname(uri.fsPath) === Constants.contractExtension.json) {
      return uri;
    } else {
      throw new Error('This file is not a valid contract.');
    }
  }
}

async function getDefaultDeployDestinations(truffleConfigsUri: string, consortiumTreeManager: ConsortiumTreeManager)
  : Promise<IDeployDestination[]> {
  return [
    {
      cmd: createNewDeploymentNetwork.bind(undefined, consortiumTreeManager, truffleConfigsUri),
      label: Constants.uiCommandStrings.CreateNewNetwork,
      networkId: '*',
    },
  ];
}

async function getTruffleDeployDestinations(truffleConfigsUri: string): Promise<IDeployDestination[]> {
  const deployDestination: IDeployDestination[] = [];

  const truffleConfig = new TruffleConfig(truffleConfigsUri);
  const networksFromConfig = await truffleConfig.getNetworks();

  networksFromConfig.forEach((network: TruffleConfiguration.INetwork) => {
    const options = network.options;
    const url = `${options.provider ? options.provider.url : ''}` ||
      `${options.host ? options.host : ''}${options.port ? ':' + options.port : ''}`;

    deployDestination.push({
      cmd: getTruffleDeployFunction(url, network.name, truffleConfigsUri, network.options.network_id),
      consortiumId: options.consortium_id,
      cwd: path.dirname(truffleConfigsUri),
      description: url,
      detail: 'From truffle-config.js',
      label: network.name,
      networkId: options.network_id,
    });
  });

  return deployDestination;
}

async function getConsortiumDeployDestinations(truffleConfigsUri: string, consortiumTreeManager: ConsortiumTreeManager)
  : Promise<IDeployDestination[]> {
  const deployDestination: IDeployDestination[] = [];
  const networks = consortiumTreeManager.getItems(true);

  networks.forEach((network) => {
    network.getChildren().forEach((child) => {
      const consortium = child as Consortium;
      const urls = consortium.getUrls().map((url) => format(url)).join(', ');

      deployDestination.push({
        cmd: getConsortiumCreateFunction(urls, consortium, truffleConfigsUri),
        consortiumId: consortium.getConsortiumId(),
        description: urls,
        detail: 'Consortium',
        label: consortium.label,
        networkId: '*',
      });
    });
  });

  return deployDestination;
}

function getTruffleDeployFunction(url: string, name: string, truffleConfigPath: string, networkId: number | string)
  : () => Promise<void> {
  // At this moment ganache-cli start only on port 8545.
  // Refactor this after the build
  if (url.match(localGanacheRegexp)) {
    return deployToLocalGanache.bind(undefined, name, truffleConfigPath);
  }
  // 1 - is the marker of main network
  if (networkId === 1 || networkId === '1') {
    return deployToMainNetwork.bind(undefined, name, truffleConfigPath);
  }
  return deployToNetwork.bind(undefined, name, truffleConfigPath);
}

function getConsortiumCreateFunction(url: string, consortium: Consortium, truffleConfigPath: string)
  : () => Promise<void> {
  // At this moment ganache-cli start only on port 8545.
  // Refactor this after the build
  if (url.match(localGanacheRegexp)) {
    return createLocalGanacheNetwork.bind(undefined, consortium, truffleConfigPath);
  }
  if (consortium instanceof MainNetworkConsortium) {
    return createMainNetwork.bind(undefined, consortium, truffleConfigPath);
  }
  return createNetwork.bind(undefined, consortium, truffleConfigPath);
}

async function execute(deployDestination: IDeployDestination[]): Promise<void> {
  const command = await showQuickPick(
    deployDestination,
    {
      ignoreFocusOut: true,
      placeHolder: Constants.placeholders.selectDeployDestination,
    },
  );
  await command.cmd();
}

async function createNewDeploymentNetwork(consortiumTreeManager: ConsortiumTreeManager, truffleConfigPath: string)
  : Promise<void> {
  const consortium = await ConsortiumCommands.connectConsortium(consortiumTreeManager);

  await createNetwork(consortium, truffleConfigPath);
}

async function createNetwork(consortium: Consortium, truffleConfigPath: string): Promise<void> {
  const network = await consortium.getTruffleNetwork();
  const truffleConfig = new TruffleConfig(truffleConfigPath);
  await truffleConfig.setNetworks(network);

  await deployToNetwork(network.name, truffleConfigPath);
}

async function createMainNetwork(consortium: Consortium, truffleConfigPath: string): Promise<void> {
  await showConfirmPaidOperationDialog();

  await createNetwork(consortium, truffleConfigPath);
}

async function deployToNetwork(networkName: string, truffleConfigPath: string): Promise<void> {
  return window.withProgress({
    location: ProgressLocation.Window,
    title: Constants.statusBarMessages.deployingContracts(networkName),
  }, async () => {
    const workspaceRoot = path.dirname(truffleConfigPath);

    await fs.ensureDir(workspaceRoot);
    await outputCommandHelper.executeCommand(
      workspaceRoot,
      'npx',
      'truffle', 'migrate', '--reset', '--network', networkName,
    );
  });
}

async function createLocalGanacheNetwork(consortium: Consortium, truffleConfigPath: string): Promise<void> {
  await GanacheCommands.startGanacheServer();

  await createNetwork(consortium, truffleConfigPath);
}

async function deployToLocalGanache(networkName: string, truffleConfigPath: string): Promise<void> {
  await GanacheCommands.startGanacheServer();

  await deployToNetwork(networkName, truffleConfigPath);
}

async function deployToMainNetwork(networkName: string, truffleConfigPath: string): Promise<void> {
  await showConfirmPaidOperationDialog();

  await deployToNetwork(networkName, truffleConfigPath);
}

async function readCompiledContract(uri: Uri): Promise<any> {
  const contractUri = await TruffleCommands.acquireCompiledContractUri(uri);
  const data = fs.readFileSync(contractUri.fsPath, null);

  return JSON.parse(data.toString());
}
