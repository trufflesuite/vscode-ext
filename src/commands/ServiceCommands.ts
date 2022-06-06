// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {QuickPickItem} from "vscode";
import {Constants} from "../Constants";
import {telemetryHelper} from "../helpers";
import {showInputBox, showQuickPick} from "../helpers/userInteraction";
import {ItemType} from "../Models";
import {
  InfuraProject,
  InfuraService,
  LocalProject,
  LocalService,
  Project,
  Service,
  ServiceTypes,
  TLocalProjectOptions,
  GenericProject,
  GenericService,
} from "../Models/TreeItems";
import {InfuraResourceExplorer, LocalResourceExplorer, GenericResourceExplorer} from "../resourceExplorers";
import {GanacheService, TreeManager} from "../services";
import {Telemetry} from "../TelemetryClient";
import {ProjectView} from "../ViewItems";

interface IServiceDestination {
  cmd: (service: Service) => Promise<Project>;
  itemType: ServiceTypes;
  label: string;
  picked?: boolean;
}

type TNetwork = {
  label: string;
};

type TServiceType = {
  label: string;
  isForked: boolean;
  description: string;
  networks: TNetwork[];
};

export namespace ServiceCommands {
  export async function createProject(): Promise<Project> {
    Telemetry.sendEvent("ServiceCommands.createProject.commandStarted");

    const serviceDestinations: IServiceDestination[] = [
      {
        cmd: createLocalProject,
        itemType: ItemType.LOCAL_SERVICE,
        label: Constants.treeItemData.service.local.label,
      },
      {
        cmd: createInfuraProject,
        itemType: ItemType.INFURA_SERVICE,
        label: Constants.treeItemData.service.infura.label,
      },
    ];

    const project = await execute(serviceDestinations);

    Telemetry.sendEvent("ServiceCommands.createProject.commandFinished", {
      itemType: telemetryHelper.mapItemType(project.itemType),
    });

    return project;
  }

  export async function connectProject(): Promise<Project> {
    Telemetry.sendEvent("ServiceCommands.connectProject.commandStarted");
    const serviceDestinations: IServiceDestination[] = [
      {
        cmd: connectLocalProject,
        itemType: ItemType.LOCAL_SERVICE,
        label: Constants.treeItemData.service.local.label,
      },
      {
        cmd: connectInfuraProject,
        itemType: ItemType.INFURA_SERVICE,
        label: Constants.treeItemData.service.infura.label,
      },
      {
        cmd: connectGenericProject,
        itemType: ItemType.GENERIC_SERVICE,
        label: Constants.treeItemData.service.generic.label,
      },
    ];

    const project = await execute(serviceDestinations);

    Telemetry.sendEvent("ServiceCommands.connectProject.commandFinished", {
      itemType: telemetryHelper.mapItemType(project.itemType),
    });

    return project;
  }

  export async function disconnectProject(viewItem: ProjectView): Promise<void> {
    Telemetry.sendEvent("ServiceCommands.disconnectProject.commandStarted");
    if (viewItem.extensionItem instanceof LocalProject) {
      Telemetry.sendEvent("ServiceCommands.disconnectProject.LocalNetworkSelected");
      const port = viewItem.extensionItem.port;

      if (port) {
        Telemetry.sendEvent("ServiceCommands.disconnectProject.stopGanacheServer");
        await GanacheService.stopGanacheServer(port);
      }
    }

    TreeManager.removeItem(viewItem.extensionItem);
    Telemetry.sendEvent("ServiceCommands.disconnectProject.commandFinished");
  }
}

async function execute(serviceDestinations: IServiceDestination[]): Promise<Project> {
  const destination = await selectDestination(serviceDestinations);

  const service = TreeManager.getItem(destination.itemType);
  const child = await destination.cmd(service);

  await addChild(service, child);

  return child;
}

async function selectDestination(serviceDestination: IServiceDestination[]): Promise<IServiceDestination> {
  return showQuickPick(serviceDestination, {
    ignoreFocusOut: true,
    placeHolder: `${Constants.placeholders.selectDestination}.`,
  });
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
  const serviceTypes: TServiceType[] = await loadServiceType();
  const serviceType: TServiceType = await getServiceTypes(serviceTypes);

  const options: TLocalProjectOptions = {
    isForked: serviceType.isForked,
    forkedNetwork: "",
    url: "",
    blockNumber: 0,
  };

  if (serviceType.isForked) {
    options.forkedNetwork = (await getNetworks(serviceType.networks)).label;

    if (options.forkedNetwork === Constants.treeItemData.service.local.type.forked.networks.other)
      options.url = await getHostAddress();

    options.blockNumber = await getBlockNumber();
  }

  const localResourceExplorer = new LocalResourceExplorer();
  return localResourceExplorer.createProject(await getExistingNames(service), await getExistingPorts(service), options);
}

async function connectLocalProject(service: LocalService): Promise<LocalProject> {
  const options: TLocalProjectOptions = {
    isForked: false,
    blockNumber: 0,
    forkedNetwork: "",
    url: "",
  };

  const localResourceExplorer = new LocalResourceExplorer();
  return localResourceExplorer.selectProject(await getExistingNames(service), await getExistingPorts(service), options);
}

async function getExistingNames(service: LocalService): Promise<string[]> {
  const localProjects = service.getChildren() as LocalProject[];
  return localProjects.map((item) => item.label);
}

async function getExistingPorts(service: LocalService): Promise<number[]> {
  const localProjects = service.getChildren() as LocalProject[];
  return localProjects.map((item) => item.port);
}

async function getServiceTypes(serviceTypes: TServiceType[]): Promise<TServiceType> {
  const items: QuickPickItem[] = [];

  serviceTypes.forEach(async (element) => {
    items.push({
      label: element.label,
    });
  });

  const result: QuickPickItem = await showQuickPick(items, {
    ignoreFocusOut: true,
    placeHolder: `${Constants.placeholders.selectType}.`,
  });

  return serviceTypes.find((item) => item.label === result.label)!;
}

async function getNetworks(networks: TNetwork[]): Promise<TNetwork> {
  const items: QuickPickItem[] = [];

  networks.forEach(async (element) => {
    items.push({
      label: element.label,
    });
  });

  const result: QuickPickItem = await showQuickPick(items, {
    ignoreFocusOut: true,
    placeHolder: `${Constants.placeholders.selectNetwork}.`,
  });

  return networks.find((item) => item.label === result.label)!;
}

async function getBlockNumber(): Promise<number> {
  const blockNumber: string = await showInputBox({
    ignoreFocusOut: true,
    prompt: Constants.paletteLabels.enterBlockNumber,
    placeHolder: Constants.placeholders.enterBlockNumber,
    validateInput: async (value: string) => {
      if (value.length === 0) return null;

      if (!value.match(Constants.validationRegexps.onlyNumber)) return Constants.validationMessages.valueShouldBeNumber;

      return null;
    },
  });

  return Number(blockNumber);
}

async function getHostAddress(): Promise<string> {
  const url: string = await showInputBox({
    ignoreFocusOut: true,
    prompt: Constants.paletteLabels.enterNetworkUrl,
    placeHolder: Constants.placeholders.enterNetworkUrl,
    validateInput: async (value: string) => {
      if (value.length === 0) return Constants.validationMessages.invalidHostAddress;
      if (!value.match(Constants.validationRegexps.isUrl)) return Constants.validationMessages.invalidHostAddress;

      return null;
    },
  });

  return url;
}

async function loadServiceType(): Promise<TServiceType[]> {
  const networks: TServiceType[] = [
    {
      label: Constants.treeItemData.service.local.type.default.label,
      isForked: Constants.treeItemData.service.local.type.default.isForked,
      description: Constants.treeItemData.service.local.type.default.description,
      networks: [],
    },
    {
      label: Constants.treeItemData.service.local.type.forked.label,
      isForked: Constants.treeItemData.service.local.type.forked.isForked,
      description: Constants.treeItemData.service.local.type.forked.description,
      networks: [
        {label: Constants.treeItemData.service.local.type.forked.networks.mainnet},
        {label: Constants.treeItemData.service.local.type.forked.networks.ropsten},
        {label: Constants.treeItemData.service.local.type.forked.networks.kovan},
        {label: Constants.treeItemData.service.local.type.forked.networks.rinkeby},
        {label: Constants.treeItemData.service.local.type.forked.networks.goerli},
        {label: Constants.treeItemData.service.local.type.forked.networks.other},
      ],
    },
  ];

  return networks;
}
// ------------ GENERIC ------------ //
async function connectGenericProject(service: GenericService): Promise<GenericProject> {
  const genericResourceExplorer = new GenericResourceExplorer();
  return genericResourceExplorer.selectProject(await getExistingNames(service), await getExistingPorts(service));
}

async function addChild(service: Service, child: Project): Promise<void> {
  service.addChild(child);

  Telemetry.sendEvent("ServiceCommands.execute.newServiceItem", {
    ruri: Telemetry.obfuscate((child.resourceUri || "").toString()),
    type: Telemetry.obfuscate(child.itemType.toString()),
    url: Telemetry.obfuscate(JSON.stringify(await child.getRPCAddress())),
  });
}
