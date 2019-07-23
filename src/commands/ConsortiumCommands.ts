// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ConsortiumResourceExplorer } from '../ConsortiumResourceExplorer';
import { Constants } from '../Constants';
import { GanacheService } from '../GanacheService/GanacheService';
import { showInputBox, showQuickPick } from '../helpers';
import { findPid } from '../helpers/shell';
import {
  AzureConsortium,
  Consortium,
  ItemType,
  LocalNetworkConsortium,
  MainNetworkConsortium,
  Network,
  TestNetworkConsortium,
} from '../Models';
import { Telemetry } from '../TelemetryClient';
import { ConsortiumTreeManager } from '../treeService/ConsortiumTreeManager';
import { UrlValidator } from '../validators/UrlValidator';
import { ConsortiumView } from '../ViewItems';

interface IConsortiumDestination {
  cmd: (network?: Network) => Promise<Consortium>;
  itemType: ItemType;
  label: string;
}

export namespace ConsortiumCommands {
  export async function createConsortium(consortiumTreeManager: ConsortiumTreeManager): Promise<Consortium> {
    Telemetry.sendEvent('ConsortiumCommands.createConsortium.commandStarted');
    const createConsortiumDestination: IConsortiumDestination[] = [
      {
        cmd: selectOrCreateConsortium,
        itemType: ItemType.AZURE_BLOCKCHAIN,
        label: Constants.uiCommandStrings.CreateConsortiumAzureBlockchainService,
      },
    ];

    const consortium = await execute(createConsortiumDestination, consortiumTreeManager, false);
    Telemetry.sendEvent('ConsortiumCommands.createConsortium.commandFinished');
    return consortium;
  }

  export async function connectConsortium(consortiumTreeManager: ConsortiumTreeManager): Promise<Consortium> {
    Telemetry.sendEvent('ConsortiumCommands.connectConsortium.commandStarted');
    const connectConsortiumDestination: IConsortiumDestination[] = [
      {
        cmd: connectLocalNetwork,
        itemType: ItemType.LOCAL_NETWORK,
        label: Constants.uiCommandStrings.ConnectConsortiumLocalGanache,
      },
      {
        cmd: selectOrCreateConsortium,
        itemType: ItemType.AZURE_BLOCKCHAIN,
        label: Constants.uiCommandStrings.ConnectConsortiumAzureBlockchainService,
      },
      {
        cmd: connectToEthereumTestnet,
        itemType: ItemType.ETHEREUM_TEST_NETWORK,
        label: Constants.uiCommandStrings.ConnectConsortiumTestEthereum,
      },
      {
        cmd: connectToPublicNetwork,
        itemType: ItemType.ETHEREUM_MAIN_NETWORK,
        label: Constants.uiCommandStrings.ConnectConsortiumPublicEthereum,
      },
    ];

    const consortium = await execute(connectConsortiumDestination, consortiumTreeManager);
    Telemetry.sendEvent('ConsortiumCommands.connectConsortium.commandFinished');
    return consortium;
  }

  export async function disconnectConsortium(consortiumTreeManager: ConsortiumTreeManager, viewItem: ConsortiumView)
    : Promise<void> {
    Telemetry.sendEvent('ConsortiumCommands.disconnectConsortium.commandStarted');
    if (viewItem.extensionItem instanceof LocalNetworkConsortium) {
      Telemetry.sendEvent('ConsortiumCommands.disconnectConsortium.localNetworkConsortiumSelected');
      const port = await viewItem.extensionItem.getPort();

      if (port) {
        Telemetry.sendEvent('ConsortiumCommands.disconnectConsortium.portDefined');
        await GanacheService.stopGanacheServer(port);
      }
    }

    const consortiumView = await consortiumTreeManager.removeItem(viewItem.extensionItem);
    Telemetry.sendEvent('ConsortiumCommands.disconnectConsortium.commandFinished');
    return consortiumView;
  }
}

async function execute(
  consortiumDestination: IConsortiumDestination[],
  consortiumTreeManager: ConsortiumTreeManager,
  addChild: boolean = true,
): Promise<Consortium> {
  const destination = await selectDestination(consortiumDestination);
  const networkItem = await getNetwork(consortiumTreeManager, destination.itemType);
  const consortiumItem = await destination.cmd(networkItem);

  if (addChild) {
    Telemetry.sendEvent('ConsortiumCommands.execute.addChild');
    await networkItem.addChild(consortiumItem);
  }

  Telemetry.sendEvent(
    'ConsortiumCommands.execute.newConsortiumItem',
    {
      ruri: Telemetry.obfuscate((consortiumItem.resourceUri || '').toString()),
      type: Telemetry.obfuscate(consortiumItem.itemType.toString()),
      urls: Telemetry.obfuscate(JSON.stringify(consortiumItem.getUrls())),
    });
  return consortiumItem;
}

function getConnectedAbsConsortia(networkItem: Network): string[] {
  return networkItem
    .getChildren()
    .filter((e) => e.label)
    .map((e) => e.label) as string[];
}

async function selectDestination(consortiumDestination: IConsortiumDestination[]): Promise<IConsortiumDestination> {
  return showQuickPick(
    consortiumDestination,
    {
      ignoreFocusOut: true,
      placeHolder: Constants.placeholders.selectDestination,
    },
  );
}

async function getNetwork(consortiumTreeManager: ConsortiumTreeManager, itemType: ItemType): Promise<Network> {
  const networkItem = consortiumTreeManager.getItem(itemType) as Network;

  if (networkItem === undefined) {
    const error = new Error(Constants.errorMessageStrings.ActionAborted);
    Telemetry.sendException(error);
    throw error;
  }

  return networkItem;
}

async function selectOrCreateConsortium(network?: Network): Promise<AzureConsortium> {
  const excludedItems = network ? getConnectedAbsConsortia(network) : [];
  const azureResourceExplorer = new ConsortiumResourceExplorer();
  return azureResourceExplorer.selectOrCreateConsortium(excludedItems);
}

async function connectLocalNetwork(network?: Network): Promise<LocalNetworkConsortium> {

  const ports = await getExistingLocalPorts(network);

  const port = await showInputBox({
    ignoreFocusOut: true,
    prompt: Constants.paletteABSLabels.enterLocalNetworkLocation,
    validateInput: async (value: string) => {

      const validationError = UrlValidator.validatePort(value);
      if (validationError) {
        return validationError;
      }

      if (ports.some((existPort) => existPort === value)) {
        return Constants.validationMessages.networkAlreadyExists;
      }

      if (!isNaN(await findPid(value))) {
        return Constants.validationMessages.portAlreadyInUse;
      }

      return null;
    },
  });

  await GanacheService.startGanacheServer(port);

  const label = `${Constants.localhostName}:${port}`;
  const url = `${Constants.networkProtocols.http}${Constants.localhost}:${port}`;
  return new LocalNetworkConsortium(label, url);
}

async function connectToEthereumTestnet(): Promise<TestNetworkConsortium> {
  const consortiumName = await getConsortiumName();
  const url = await getConsortiumUrl();

  return new TestNetworkConsortium(consortiumName, url);
}

async function connectToPublicNetwork(): Promise<MainNetworkConsortium> {
  const consortiumName = await getConsortiumName();
  const url = await getConsortiumUrl();

  return new MainNetworkConsortium(consortiumName, url);
}

async function getConsortiumName() {
  return showInputBox({
    ignoreFocusOut: true,
    prompt: Constants.paletteABSLabels.enterConsortiumName,
    validateInput: (value: string) => {
      if (!value) {
        return Constants.validationMessages.valueCannotBeEmpty;
      }

      return;
    },
  });
}

async function getConsortiumUrl() {
  return showInputBox({
    ignoreFocusOut: true,
    prompt: Constants.paletteABSLabels.enterNetworkLocation,
    validateInput: (value: string) => {
      return UrlValidator.validateHostUrl(value);
    },
  });
}

async function getExistingLocalPorts(network?: Network): Promise<string[]> {
  const localNetworks = network ? await network.getChildren() : [];
  return await Promise.all((localNetworks as LocalNetworkConsortium[])
    .map(async (item) => `${await item.getPort()}`));
}
