// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import open from "open";
import {QuickPickItem} from "vscode";
import {Constants} from "../Constants";
import {showInputBox, showQuickPick, telemetryHelper} from "../helpers";
import {ItemType} from "../Models";
import {
  // AzureBlockchainProject,
  // AzureBlockchainService,
  // BlockchainDataManagerNetworkNode,
  // BlockchainDataManagerProject,
  // BlockchainDataManagerService,
  InfuraProject,
  InfuraService,
  LocalProject,
  LocalService,
  Project,
  Service,
  ServiceTypes,
  TLocalProjectOptions,
} from "../Models/TreeItems";
import {
  // BlockchainDataManagerResourceExplorer,
  // ConsortiumResourceExplorer,
  InfuraResourceExplorer,
  LocalResourceExplorer,
  // StorageAccountResourceExplorer,
} from "../resourceExplorers";
import {GanacheService, TreeManager} from "../services";
import {Telemetry} from "../TelemetryClient";
import {NetworkNodeView, ProjectView} from "../ViewItems";

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
      // {
      //   cmd: createAzureBlockchainProject,
      //   itemType: ItemType.AZURE_BLOCKCHAIN_SERVICE,
      //   label: Constants.treeItemData.service.azure.label,
      // },
      {
        cmd: createInfuraProject,
        itemType: ItemType.INFURA_SERVICE,
        label: Constants.treeItemData.service.infura.label,
      },
      // {
      //   cmd: createBlockchainDataManagerProject,
      //   itemType: ItemType.BLOCKCHAIN_DATA_MANAGER_SERVICE,
      //   label: Constants.treeItemData.service.bdm.label,
      // },
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
      // {
      //   cmd: connectAzureBlockchainProject,
      //   itemType: ItemType.AZURE_BLOCKCHAIN_SERVICE,
      //   label: Constants.treeItemData.service.azure.label,
      // },
      {
        cmd: connectInfuraProject,
        itemType: ItemType.INFURA_SERVICE,
        label: Constants.treeItemData.service.infura.label,
      },
      // {
      //   cmd: connectBlockchainDataManagerProject,
      //   itemType: ItemType.BLOCKCHAIN_DATA_MANAGER_SERVICE,
      //   label: Constants.treeItemData.service.bdm.label,
      // },
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

  export function openAtAzurePortal(viewItem: NetworkNodeView): void {
    open(viewItem.extensionItem.url.href);
  }

  // export async function deleteBDMApplication(viewItem: NetworkNodeView): Promise<void> {
  //   Telemetry.sendEvent("ServiceCommands.deleteBDMApplication.commandStarted");

  //   const application = viewItem.extensionItem;
  //   const selectedBDM = application.getParent() as BlockchainDataManagerProject;

  //   const bdmResourceExplorer = new BlockchainDataManagerResourceExplorer();
  //   const storageAccountResourceExplorer = new StorageAccountResourceExplorer();

  //   await bdmResourceExplorer.deleteBDMApplication(
  //     selectedBDM.label,
  //     application as BlockchainDataManagerNetworkNode,
  //     storageAccountResourceExplorer
  //   );

  //   Telemetry.sendEvent("ServiceCommands.deleteBDMApplication.commandFinished");
  // }

  // export async function createNewBDMApplication(viewItem: ProjectView): Promise<void> {
  //   Telemetry.sendEvent("ServiceCommands.createNewBDMApplication.commandStarted");

  //   const selectedBDM = viewItem.extensionItem as BlockchainDataManagerProject;

  //   const bdmResourceExplorer = new BlockchainDataManagerResourceExplorer();
  //   const storageAccountResourceExplorer = new StorageAccountResourceExplorer();

  //   await bdmResourceExplorer.createNewBDMApplication(
  //     selectedBDM as BlockchainDataManagerProject,
  //     storageAccountResourceExplorer
  //   );
  //   Telemetry.sendEvent("ServiceCommands.createNewBDMApplication.commandFinished");
  // }
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

// ------------ AZURE BLOCKCHAIN ------------ //
// async function createAzureBlockchainProject(_service: AzureBlockchainService): Promise<AzureBlockchainProject> {
//   const azureResourceExplorer = new ConsortiumResourceExplorer();
//   return azureResourceExplorer.createProject();
// }

// async function connectAzureBlockchainProject(service: AzureBlockchainService): Promise<AzureBlockchainProject> {
//   const azureResourceExplorer = new ConsortiumResourceExplorer();
//   return azureResourceExplorer.selectProject(await getExistingConsortia(service));
// }

// async function getExistingConsortia(service: AzureBlockchainService): Promise<string[]> {
//   const azureBlockchainProjects = service.getChildren() as AzureBlockchainProject[];
//   return azureBlockchainProjects.map((item) => item.label); // Maybe member name?
// }

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
  };

  if (serviceType.isForked) {
    options.forkedNetwork = (await getNetworks(serviceType.networks)).label;

    if (options.forkedNetwork.Equals(Constants.treeItemData.service.local.type.forked.networks.other))
      options.url = await getHostAddress();

    options.blockNumber = await getBlockNumber();
  }

  const localResourceExplorer = new LocalResourceExplorer();
  return localResourceExplorer.createProject(await getExistingNames(service), await getExistingPorts(service), options);
}

async function connectLocalProject(service: LocalService): Promise<LocalProject> {
  const options: TLocalProjectOptions = {
    isForked: false,
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

  return serviceTypes.find((item) => item.label.Equals(result.label))!;
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

  return networks.find((item) => item.label.Equals(result.label))!;
}

async function getBlockNumber(): Promise<number> {
  const blockNumber: string = await showInputBox({
    ignoreFocusOut: true,
    prompt: Constants.paletteLabels.enterBlockNumber,
    placeHolder: Constants.placeholders.enterBlockNumber,
    validateInput: async (value: string) => {
      if (value.length.Equals(0)) return null;

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
      if (value.length.Equals(0)) return Constants.validationMessages.invalidHostAddress;
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
// ------------ BLOCKCHAIN DATA MANAGER ------------ //

// async function connectBlockchainDataManagerProject(
//   service: BlockchainDataManagerService
// ): Promise<BlockchainDataManagerProject> {
//   const bdmResourceExplorer = new BlockchainDataManagerResourceExplorer();

//   return bdmResourceExplorer.selectProject(await getExistingBlockchainDataManager(service), addConsortiumToTree);
// }

// async function createBlockchainDataManagerProject(): Promise<BlockchainDataManagerProject> {
//   const consortiumResourceExplorer = new ConsortiumResourceExplorer();
//   const bdmResourceExplorer = new BlockchainDataManagerResourceExplorer();

//   return bdmResourceExplorer.createProject(consortiumResourceExplorer, addConsortiumToTree);
// }

// async function getExistingBlockchainDataManager(service: BlockchainDataManagerService): Promise<string[]> {
//   const bdmProjects = service.getChildren() as BlockchainDataManagerProject[];
//   return bdmProjects.map((item) => item.label);
// }

// async function addConsortiumToTree(consortium: AzureBlockchainProject): Promise<void> {
//   const service = await TreeManager.getItem(ItemType.AZURE_BLOCKCHAIN_SERVICE);

//   await addChild(service, consortium);
// }

async function addChild(service: Service, child: Project): Promise<void> {
  service.addChild(child);

  Telemetry.sendEvent("ServiceCommands.execute.newServiceItem", {
    ruri: Telemetry.obfuscate((child.resourceUri || "").toString()),
    type: Telemetry.obfuscate(child.itemType.toString()),
    url: Telemetry.obfuscate(JSON.stringify(await child.getRPCAddress())),
  });
}
