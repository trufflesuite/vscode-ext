// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { GanacheCommands } from '../commands/GanacheCommands';
import { Constants } from '../Constants';
import { showInputBox, showQuickPick } from '../helpers';
import {
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
import { WestlakeCommands } from './WestlakeCommands';

interface IConsortiumDestination {
  cmd: (childrenFilters?: string[]) => Promise<Consortium>;
  itemType: ItemType;
  label: string;
}

export namespace ConsortiumCommands {
  export async function createConsortium(): Promise<Consortium> {
    const createConsortiumDestination: IConsortiumDestination[] = [
      {
        cmd: WestlakeCommands.createWestlakeConsortium,
        itemType: ItemType.AZURE_BLOCKCHAIN,
        label: Constants.uiCommandStrings.CreateConsortiumAzureBlockchainService,
      },
    ];

    const destination = await selectDestination(createConsortiumDestination);
    return await destination.cmd();
  }

  export async function connectConsortium(consortiumTreeManager: ConsortiumTreeManager): Promise<Consortium> {
    const connectConsortiumDestination: IConsortiumDestination[] = [
      {
        cmd: connectLocalNetwork,
        itemType: ItemType.LOCAL_NETWORK,
        label: Constants.uiCommandStrings.ConnectConsortiumLocalGanache,
      },
      {
        cmd: WestlakeCommands.selectWestlakeConsortium,
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
        GanacheCommands.stopGanacheServer();
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
  const childrenFilters = await getChildrenFilters(networkItem);
  const consortiumItem = await destination.cmd(childrenFilters);

  await networkItem.addChild(consortiumItem);

  return consortiumItem;
}

function getChildrenFilters(networkItem: Network): string[] {
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

async function connectLocalNetwork(): Promise<LocalNetworkConsortium> {
  await GanacheCommands.startGanacheServer();

  const port = await showInputBox({
    ignoreFocusOut: true,
    prompt: Constants.paletteWestlakeLabels.enterLocalNetworkLocation,
    validateInput: (value: string) => {
      if (!value) {
        return Constants.validationMessages.valueCannotBeEmpty;
      }

      if (value.match(new RegExp(/^\d+$/g))) {
        value = `${Constants.networkProtocols.http}${Constants.localhost}:${value}`;
        return UrlValidator.validateHostUrl(value);
      }

      return;
    }});

  const label = `localhost:${port}`;
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
