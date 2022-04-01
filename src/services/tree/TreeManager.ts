// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Memento} from "vscode";
import {Constants} from "../../Constants";
import {ItemFactory} from "../../Models";
import {
  AzureBlockchainService,
  BlockchainDataManagerService,
  Command,
  IExtensionItem,
  InfuraService,
  LocalService,
  Service,
  ServiceTypes,
} from "../../Models/TreeItems";
import {Output} from "../../Output";
import {Telemetry} from "../../TelemetryClient";

class ExtensionTreeManager {
  private items: Service[];
  private globalState?: Memento;

  constructor() {
    this.items = [];
  }

  public initialize(globalState: Memento): void {
    this.globalState = globalState;
    this.items = this.loadState();
  }

  public dispose(): void {
    this.saveState();
  }

  public loadState(): Service[] {
    let items: Service[] = [];
    const store = this.globalState && this.globalState.get(Constants.globalStateKeys.serviceResourceKey, undefined);
    if (store) {
      try {
        const obj = JSON.parse(store);
        if (Array.isArray(obj)) {
          items = obj
            .map((child) => ItemFactory.create(child))
            .filter((child) => child instanceof Service) as Service[];
        }
      } catch (error) {
        Telemetry.sendException(error as Error);
        Output.outputLine(
          Constants.outputChannel.treeManager,
          `${Constants.errorMessageStrings.LoadServiceTreeFailed} ${(error as Error).message}`
        );
      }
    }

    return this.fillDefaultTypes(items);
  }

  public saveState(): void {
    if (this.globalState) {
      this.globalState.update(Constants.globalStateKeys.serviceResourceKey, JSON.stringify(this.items));
    }
  }

  public getItem(itemType: ServiceTypes): Service {
    const findItem = this.items.find((item) => item.itemType === itemType) as Service;
    return findItem!;
  }

  public getItems(): Service[] {
    let result = this.items.filter((item) => item.getChildren().length !== 0);
    if (result.length === 0) {
      Telemetry.sendEvent("TreeManager.getItems.returnDefaultCommandsItems");
      result = defaultCommandsItems();
    }

    return result;
  }

  // FIXME: It's method works for any IExtensionItem, it shouldn't be here
  public removeItem(extensionItem: IExtensionItem): void {
    const parent = extensionItem.getParent();
    if (parent) {
      parent.removeChild(extensionItem);
    }
  }

  // FIXME: We should use factory and ItemTypes instead of direct classes
  private fillDefaultTypes(items: Service[]): Service[] {
    let trufflesuite = items.find((item) => item instanceof AzureBlockchainService);
    if (!trufflesuite) {
      trufflesuite = new AzureBlockchainService();
    }

    let localService = items.find((item) => item instanceof LocalService);
    if (!localService) {
      localService = new LocalService();
    }

    let infuraService = items.find((item) => item instanceof InfuraService);
    if (!infuraService) {
      infuraService = new InfuraService();
    }

    let bdmService = items.find((item) => item instanceof BlockchainDataManagerService);
    if (!bdmService) {
      bdmService = new BlockchainDataManagerService();
    }

    return [trufflesuite, infuraService, localService, bdmService];
  }
}

function defaultCommandsItems(): Command[] {
  return [
    new Command("Connect to network", "truffle-vscode.connectProject"),
    new Command("Create a new network", "truffle-vscode.createProject"),
  ];
}

export const TreeManager = new ExtensionTreeManager();
