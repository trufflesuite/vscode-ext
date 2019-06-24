// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ExtensionContext } from 'vscode';
import { Constants } from '../Constants';
import { Command, IExtensionItem, ItemFactory, ItemType, Network } from '../Models';
import { Output } from '../Output';

export class ConsortiumTreeManager {
  private readonly items: IExtensionItem[];
  private readonly resourceKey: string = Constants.consortiumTreeResourceKey;

  constructor(private readonly context: ExtensionContext) {
    this.items = this.loadState();
  }

  public loadState(): IExtensionItem[] {
    const store = this.context.globalState.get(this.resourceKey, '');
    if (store) {
      try {
        const obj = JSON.parse(store);

        if (Array.isArray(obj)) {
          return obj.map((child) => ItemFactory.create(child));
        }
      } catch (error) {
        Output.outputLine(
          Constants.outputChannel.consortiumTreeManager,
          `Load consortium tree error: ${error.message}`);
      }
    }

    return defaultNetworksItems();
  }

  public saveState(): void {
    this.context.globalState.update(this.resourceKey, JSON.stringify(this.items));
  }

  public getItem(itemType: ItemType): IExtensionItem | undefined {
    return this.items.find((item) => item.itemType === itemType);
  }

  public getItems(ignoreItemWithoutChildren: boolean = false): IExtensionItem[] {
    let result = this.items;

    if (ignoreItemWithoutChildren) {
      result = this.items.filter((item) => item.getChildren().length !== 0);
      if (result.length === 0) {
        result = defaultCommandsItems();
      }
    }
    return result;
  }

  public removeItem(extensionItem: IExtensionItem): void {
    const parent = extensionItem.getParent();
    if (parent) {
      parent.removeChild(extensionItem);
    }
  }
}

function defaultNetworksItems(): IExtensionItem[] {
  return [
    new Network(Constants.networkName.azure, ItemType.AZURE_BLOCKCHAIN),
    new Network(Constants.networkName.local, ItemType.LOCAL_NETWORK),
    new Network(Constants.networkName.testnet, ItemType.ETHEREUM_TEST_NETWORK),
    new Network(Constants.networkName.mainnet, ItemType.ETHEREUM_MAIN_NETWORK),
  ];
}

function defaultCommandsItems() {
  return [
    new Command('Connect to Consortium', 'azureBlockchainService.connectConsortium'),
    new Command('Create Azure Blockchain Service', 'azureBlockchainService.createConsortium'),
  ];
}
