// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as open from 'open';
import { Constants } from '../Constants';
import { showQuickPick } from '../helpers';
import { ItemType } from '../Models';
import {
  AzureBlockchainProject,
  AzureBlockchainService,
  BlockchainDataManagerProject,
  BlockchainDataManagerService,
  InfuraProject,
  InfuraService,
  LocalProject,
  LocalService,
  Project,
  Service,
  ServiceTypes,
} from '../Models/TreeItems';
import {
  BlockchainDataManagerResourceExplorer,
  ConsortiumResourceExplorer,
  InfuraResourceExplorer,
  LocalResourceExplorer,
} from '../resourceExplorers';
import { GanacheService, TreeManager } from '../services';
import { Telemetry } from '../TelemetryClient';
import { NetworkNodeView, ProjectView } from '../ViewItems';

interface IServiceDestination {
  cmd: (service: Service) => Promise<Project>;
  itemType: ServiceTypes;
  label: string;
  picked?: boolean;
}

export namespace ServiceCommands {
  export async function createProject(): Promise<Project> {
    Telemetry.sendEvent('ServiceCommands.createProject.commandStarted');
    const serviceDestinations: IServiceDestination[] = [
      {
        cmd: createLocalProject,
        itemType: ItemType.LOCAL_SERVICE,
        label: Constants.treeItemData.service.local.label,
      },
      {
        cmd: createAzureBlockchainProject,
        itemType: ItemType.AZURE_BLOCKCHAIN_SERVICE,
        label: Constants.treeItemData.service.azure.label,
      },
      {
        cmd: createInfuraProject,
        itemType: ItemType.INFURA_SERVICE,
        label: Constants.treeItemData.service.infura.label,
      },
    ];

    const project = await execute(serviceDestinations);
    Telemetry.sendEvent('ServiceCommands.createProject.commandFinished');
    return project;
  }

  export async function connectProject(): Promise<Project> {
    Telemetry.sendEvent('ServiceCommands.connectProject.commandStarted');
    const serviceDestinations: IServiceDestination[] = [
      {
        cmd: connectLocalProject,
        itemType: ItemType.LOCAL_SERVICE,
        label: Constants.treeItemData.service.local.label,
      },
      {
        cmd: connectAzureBlockchainProject,
        itemType: ItemType.AZURE_BLOCKCHAIN_SERVICE,
        label: Constants.treeItemData.service.azure.label,
      },
      {
        cmd: connectInfuraProject,
        itemType: ItemType.INFURA_SERVICE,
        label: Constants.treeItemData.service.infura.label,
      },
      {
        cmd: connectBlockchainDataManagerProject,
        itemType: ItemType.BLOCKCHAIN_DATA_MANAGER_SERVICE,
        label: Constants.treeItemData.service.bdm.label,
      },
    ];

    const project = await execute(serviceDestinations);
    Telemetry.sendEvent('ServiceCommands.connectProject.commandFinished');
    return project;
  }

  export async function disconnectProject(viewItem: ProjectView): Promise<void> {
    Telemetry.sendEvent('ServiceCommands.disconnectProject.commandStarted');
    if (viewItem.extensionItem instanceof LocalProject) {
      Telemetry.sendEvent('ServiceCommands.disconnectProject.LocalNetworkSelected');
      const port = viewItem.extensionItem.port;

      if (port) {
        Telemetry.sendEvent('ServiceCommands.disconnectProject.stopGanacheServer');
        await GanacheService.stopGanacheServer(port);
      }
    }

    await TreeManager.removeItem(viewItem.extensionItem);
    Telemetry.sendEvent('ServiceCommands.disconnectProject.commandFinished');
  }

  export function openAtAzurePortal(viewItem: NetworkNodeView): void {
    open(viewItem.extensionItem.url.href);
  }
}

async function execute(serviceDestinations: IServiceDestination[]): Promise<Project> {
  const destination = await selectDestination(serviceDestinations);
  const service = await TreeManager.getItem(destination.itemType);
  const child = await destination.cmd(service);

  await service.addChild(child);

  Telemetry.sendEvent(
    'ServiceCommands.execute.newServiceItem',
    {
      ruri: Telemetry.obfuscate((child.resourceUri || '').toString()),
      type: Telemetry.obfuscate(child.itemType.toString()),
      url: Telemetry.obfuscate(JSON.stringify(await child.getRPCAddress())),
    });

  return child;
}

async function selectDestination(serviceDestination: IServiceDestination[]): Promise<IServiceDestination> {
  return showQuickPick(
    serviceDestination,
    {
      ignoreFocusOut: true,
      placeHolder: `${Constants.placeholders.selectDestination}.`,
    },
  );
}

// ------------ AZURE BLOCKCHAIN ------------ //
async function createAzureBlockchainProject(service: AzureBlockchainService): Promise<AzureBlockchainProject> {
  const azureResourceExplorer = new ConsortiumResourceExplorer();
  return azureResourceExplorer.createProject(await getExistingConsortia(service));
}

async function connectAzureBlockchainProject(service: AzureBlockchainService): Promise<AzureBlockchainProject> {
  const azureResourceExplorer = new ConsortiumResourceExplorer();
  return azureResourceExplorer.selectProject(await getExistingConsortia(service));
}

async function getExistingConsortia(service: AzureBlockchainService): Promise<string[]> {
  const azureBlockchainProjects = service.getChildren() as AzureBlockchainProject[];
  return azureBlockchainProjects.map((item) => item.label); // Maybe member name?
}

// ------------ INFURA ------------ //
async function createInfuraProject(service: InfuraService): Promise<InfuraProject> {
  const infuraResourceExplorer = new InfuraResourceExplorer();
  return infuraResourceExplorer.createProject(await getExistingProjects(service));
}

async function connectInfuraProject(service: InfuraService): Promise<InfuraProject> {
  const infuraResourceExplorer = new InfuraResourceExplorer();
  return infuraResourceExplorer.selectProject(await getExistingProjects(service), await getExistingProjectIds(service));
}

async function getExistingProjects(service: InfuraService): Promise<string[]> {
  const infuraProjects = service.getChildren() as InfuraProject[];
  return infuraProjects.map((item) => item.label);
}

async function getExistingProjectIds(service: InfuraService): Promise<string[]> {
  const infuraProjects = service.getChildren() as InfuraProject[];
  return infuraProjects.map((item) => item.projectId);
}

// ------------ LOCAL ------------ //
async function createLocalProject(service: LocalService): Promise<LocalProject> {
  const localResourceExplorer = new LocalResourceExplorer();
  return localResourceExplorer.createProject(await getExistingNames(service), await getExistingPorts(service));
}

async function connectLocalProject(service: LocalService): Promise<LocalProject> {
  const localResourceExplorer = new LocalResourceExplorer();
  return localResourceExplorer.selectProject(await getExistingNames(service), await getExistingPorts(service));
}

async function getExistingNames(service: LocalService): Promise<string[]> {
  const localProjects = service.getChildren() as LocalProject[];
  return localProjects.map((item) => item.label);
}

async function getExistingPorts(service: LocalService): Promise<number[]> {
  const localProjects = service.getChildren() as LocalProject[];
  return localProjects.map((item) => item.port);
}

// ------------ BLOCKCHAIN DATA MANAGER ------------ //

async function connectBlockchainDataManagerProject(service: BlockchainDataManagerService)
: Promise<BlockchainDataManagerProject> {
  const bdmResourceExplorer = new BlockchainDataManagerResourceExplorer();
  return bdmResourceExplorer.selectProject(await getExistingBlockchainDataManager(service));
}

async function getExistingBlockchainDataManager(service: BlockchainDataManagerService): Promise<string[]> {
  const bdmProjects = service.getChildren() as BlockchainDataManagerProject[];
  return bdmProjects.map((item) => item.label);
}
