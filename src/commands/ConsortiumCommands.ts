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
    const createConsortiumDestination: IConsortiumDestination[] = [
      {
        cmd: selectOrCreateConsortium,
        itemType: ItemType.AZURE_BLOCKCHAIN,
        label: Constants.uiCommandStrings.CreateConsortiumAzureBlockchainService,
      },
    ];

    const destination = await selectDestination(createConsortiumDestination);
    const networkItem = await getNetwork(consortiumTreeManager, destination.itemType);

    return destination.cmd(networkItem);
  }

  export async function connectConsortium(consortiumTreeManager: ConsortiumTreeManager): Promise<Consortium> {
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

    return execute(connectConsortiumDestination, consortiumTreeManager);
  }

  export async function disconnectConsortium(consortiumTreeManager: ConsortiumTreeManager, viewItem: ConsortiumView)
    : Promise<void> {
      if (viewItem.extensionItem instanceof LocalNetworkConsortium) {
        const port = await viewItem.extensionItem.getPort();

        if (port) {
          await GanacheService.stopGanacheServer(port);
        }
      }
      return consortiumTreeManager.removeItem(viewItem.extensionItem);
  }
}

async function execute(
  consortiumDestination: IConsortiumDestination[],
  consortiumTreeManager: ConsortiumTreeManager,
): Promise<Consortium> {
  const destination = await selectDestination(consortiumDestination);
  const networkItem = await getNetwork(consortiumTreeManager, destination.itemType);
  const consortiumItem = await destination.cmd(networkItem);

  await networkItem.addChild(consortiumItem);

  return consortiumItem;
}

function getConnectedAbsConsortiums(networkItem: Network): string[] {
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
      placeHolder: Constants.placeholders.selectConsortium,
    },
  );
}

async function getNetwork(consortiumTreeManager: ConsortiumTreeManager, itemType: ItemType): Promise<Network> {
  const networkItem = consortiumTreeManager.getItem(itemType) as Network;

  if (networkItem === undefined) {
    throw new Error(Constants.errorMessageStrings.ActionAborted);
  }

  return networkItem;
}

async function selectOrCreateConsortium(network?: Network): Promise<AzureConsortium> {
  const excludedItems = network ? getConnectedAbsConsortiums(network) : [];
  const azureResourceExplorer = new ConsortiumResourceExplorer();
  return azureResourceExplorer.selectOrCreateConsortium(excludedItems);
}

async function connectLocalNetwork(network?: Network): Promise<LocalNetworkConsortium> {

  const ports = await getExistingLocalPorts(network);

  const port = await showInputBox({
    ignoreFocusOut: true,
    prompt: Constants.paletteWestlakeLabels.enterLocalNetworkLocation,
    validateInput: async (value: string) => {

      const validationError = UrlValidator.validatePort(value);
      if (validationError) {
        return validationError;
      }

      if (ports.some( (existPort) => existPort === value)) {
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
    prompt: Constants.paletteWestlakeLabels.enterConsortiumName,
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
    prompt: Constants.paletteWestlakeLabels.enterNetworkLocation,
    validateInput: (value: string) => {
      return UrlValidator.validateHostUrl(value);
    }});
}

async function getExistingLocalPorts(network?: Network): Promise<string[]> {
  const localNetworks = network ? await network.getChildren() : [];
  return await Promise.all((localNetworks as LocalNetworkConsortium[])
    .map(async (item) => `${await item.getPort()}`));
}
