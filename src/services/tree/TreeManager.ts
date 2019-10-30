// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Memento } from 'vscode';
import { Constants } from '../../Constants';
import { ItemFactory } from '../../Models';
import {
  AzureBlockchainService,
  Command,
  IExtensionItem,
  InfuraService,
  LocalService,
  Service,
  ServiceTypes,
} from '../../Models/TreeItems';
import { Output } from '../../Output';
import { Telemetry } from '../../TelemetryClient';

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
        Telemetry.sendException(error);
        Output.outputLine(
          Constants.outputChannel.treeManager,
          `${Constants.errorMessageStrings.LoadServiceTreeFailed} ${error.message}`);
      }
    }

    return  this.fillDefaultTypes(items);
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
      Telemetry.sendEvent('TreeManager.getItems.returnDefaultCommandsItems');
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
    let azureBlockchainService = items.find((item) => item instanceof AzureBlockchainService);
    if (!azureBlockchainService) {
      azureBlockchainService = new AzureBlockchainService();
    }

    let localService = items.find((item) => item instanceof LocalService);
    if (!localService) {
      localService = new LocalService();
    }

    let infuraService = items.find((item) => item instanceof InfuraService);
    if (!infuraService) {
      infuraService = new InfuraService();
    }

    return [ azureBlockchainService, infuraService, localService];
  }
}

function defaultCommandsItems(): Command[] {
  return [
    new Command('Connect to network', 'azureBlockchainService.connectProject'),
    new Command('Create a new network', 'azureBlockchainService.createProject'),
  ];
}

// tslint:disable-next-line:variable-name
export const TreeManager = new ExtensionTreeManager();
