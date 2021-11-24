// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import * as fs from "fs-extra";
import * as open from "open";
import * as path from "path";
import { ProgressLocation, QuickPickItem, window } from "vscode";
import {
  BlockchainDataManagerResource,
  IAzureBlockchainDataManagerApplicationDto,
  IAzureBlockchainDataManagerDto,
  IAzureBlockchainDataManagerInputDto,
  IAzureBlockchainDataManagerOutputDto,
  ICreateBlockchainDataManagerApplicationDto,
  ICreateBlockchainDataManagerDto,
  ICreateBlockchainDataManagerInputDto,
  ICreateBlockchainDataManagerOutputDto,
  ICreateEventGridDto,
  ICreateTransactionNodeDto,
} from "../ARMBlockchain";
import { AzureBlockchainServiceClient } from "../ARMBlockchain/AzureBlockchainServiceClient";
import { EventGridManagementClient } from "../ARMBlockchain/EventGridManagementClient";
import { TruffleCommands } from "../commands/TruffleCommands";
import { Constants, NotificationOptions } from "../Constants";
import { showInputBox, showNotification, showQuickPick } from "../helpers";
import { CancellationEvent } from "../Models";
import { ItemType } from "../Models/ItemType";
import {
  BlockchainDataManagerInstanceItem,
  ConsortiumItem,
  EventGridItem,
  ResourceGroupItem,
  SubscriptionItem,
  TransactionNodeItem,
} from "../Models/QuickPickItems";
import {
  AzureBlockchainProject,
  BlockchainDataManagerInputAndOutput,
  BlockchainDataManagerNetworkNode,
  BlockchainDataManagerProject,
} from "../Models/TreeItems";
import { ContractDB, ContractInstanceWithMetadata, ContractService, TreeManager } from "../services";
import { Telemetry } from "../TelemetryClient";
import { AzureBlockchainServiceValidator } from "../validators/AzureBlockchainServiceValidator";
import { AzureResourceExplorer } from "./AzureResourceExplorer";
import { ConsortiumResourceExplorer } from "./ConsortiumResourceExplorer";
import { EventGridResourceExplorer } from "./EventGridResourceExplorer";
import { StorageAccountResourceExplorer } from "./StorageAccountResourceExplorer";

export class BlockchainDataManagerResourceExplorer extends AzureResourceExplorer {
  public async selectProject(
    existingProjects: string[] = [],
    createConsortiumCallback: (consortium: AzureBlockchainProject) => Promise<void>
  ): Promise<BlockchainDataManagerProject> {
    Telemetry.sendEvent("BlockchainDataManagerResourceExplorer.selectProject");
    await this.waitForLogin();

    const subscriptionItem = await this.getOrSelectSubscriptionItem();
    const resourceGroupItem = await this.getOrCreateResourceGroupItem(subscriptionItem);
    const azureClient = await this.getAzureClient(subscriptionItem, resourceGroupItem);

    const pick = await showQuickPick(
      [
        { label: Constants.uiCommandStrings.createBlockchainDataManagerProject },
        ...(await this.getBlockchainDataManagerInstanceItems(azureClient, existingProjects)),
      ],
      { placeHolder: Constants.placeholders.selectBlockchainDataManagerInstance, ignoreFocusOut: true }
    );

    if (pick instanceof BlockchainDataManagerInstanceItem) {
      Telemetry.sendEvent("BlockchainDataManagerResourceExplorer.selectProject.selectBlockchainDataManagerProject");
      return this.getBlockchainDataManagerInstance(pick, azureClient);
    } else {
      Telemetry.sendEvent("BlockchainDataManagerResourceExplorer.selectProject.createBlockchainDataManagerProject");
      return this.createProject(
        new ConsortiumResourceExplorer(),
        createConsortiumCallback,
        azureClient,
        subscriptionItem,
        resourceGroupItem
      );
    }
  }

  public async createProject(
    consortiumResourceExplorer: ConsortiumResourceExplorer,
    createConsortiumCallback: (consortium: AzureBlockchainProject) => Promise<void>,
    azureClient?: AzureBlockchainServiceClient,
    subscriptionItem?: SubscriptionItem,
    resourceGroupItem?: ResourceGroupItem
  ): Promise<BlockchainDataManagerProject> {
    Telemetry.sendEvent("BlockchainDataManagerResourceExplorer.createProject");
    await this.waitForLogin();

    if (!azureClient || !subscriptionItem) {
      subscriptionItem = await this.getOrSelectSubscriptionItem();
      resourceGroupItem = await this.getOrCreateResourceGroupItem(subscriptionItem);
      azureClient = await this.getAzureClient(subscriptionItem, resourceGroupItem);
    }

    const eventGridClient = await this.getEventGridClient(subscriptionItem, resourceGroupItem as ResourceGroupItem);
    const selectedConsortium = await this.getSelectedConsortium(consortiumResourceExplorer, azureClient);

    if (!(selectedConsortium instanceof ConsortiumItem)) {
      const child = await consortiumResourceExplorer.createAzureConsortium(
        azureClient,
        subscriptionItem,
        Constants.availableBlockchainDataManagerLocations
      );
      await createConsortiumCallback(child);

      Telemetry.sendEvent("BlockchainDataManagerResourceExplorer.createProject.createAzureBlockchainProject");
      throw new CancellationEvent();
    }

    const selectedMember = await this.getSelectedMember(
      consortiumResourceExplorer,
      azureClient,
      selectedConsortium.memberName
    );
    const bdmItems = await azureClient.bdmResource.getBlockchainDataManagerList();
    const selectedTransactionNode = await this.getSelectedTransactionNode(
      azureClient,
      bdmItems,
      selectedMember.label,
      selectedConsortium.location
    );

    const selectedEventGrid = await this.getSelectedEventGrid(eventGridClient, selectedConsortium.location);

    return this.createBlockchainDataManagerInstance(
      azureClient,
      bdmItems,
      selectedConsortium.location,
      selectedMember.label,
      Constants.getTransactionNodeName(selectedMember.label, selectedTransactionNode.transactionNodeName),
      selectedEventGrid.url
    );
  }

  public async deleteBDMApplication(
    bdmLabel: string,
    application: BlockchainDataManagerNetworkNode,
    storageAccountResourceExplorer: StorageAccountResourceExplorer
  ): Promise<void> {
    const { label, subscriptionId, resourceGroup, fileUrls } = application;

    const subscriptionItem = await this.getSubscriptionItem(subscriptionId);
    const azureClient = await this.getAzureClient(subscriptionItem, new ResourceGroupItem(resourceGroup));

    await azureClient.bdmResource.deleteBlockchainDataManagerApplication(bdmLabel, label);

    await TreeManager.removeItem(application);

    const localFilePaths = await ContractService.getBuildFolderPath();
    await storageAccountResourceExplorer.deleteBlobs(fileUrls, subscriptionId, resourceGroup, localFilePaths);
  }

  public async createNewBDMApplication(
    selectedBDM: BlockchainDataManagerProject,
    storageAccountResourceExplorer: StorageAccountResourceExplorer
  ): Promise<void> {
    const solidityContractsFolderPath = await ContractService.getSolidityContractsFolderPath();
    const contracts = this.getFiles(solidityContractsFolderPath, Constants.contractExtension.sol);

    if (!contracts || !contracts.length) {
      throw new Error(Constants.errorMessageStrings.SolidityContractsNotFound);
    }

    const contract = await showQuickPick(contracts.map((c) => ({ label: path.parse(c).name })) as QuickPickItem[], {
      ignoreFocusOut: true,
      placeHolder: Constants.placeholders.selectContract,
    });

    const contractInstances = await ContractDB.getContractInstances(contract.label);

    if (!contractInstances.length) {
      await this.compiledAndDeployContracts();
    }

    const instance = contractInstances[contractInstances.length - 1] as ContractInstanceWithMetadata;

    if (!instance.provider || !instance.address) {
      throw new Error(Constants.errorMessageStrings.NetworkIsNotAvailable);
    }

    const abi = JSON.stringify(instance.contract.abi);

    const [byteCode, applicationName] = await Promise.all([
      ContractService.getDeployedBytecodeByAddress(instance.provider.host, instance!.address),
      this.getBDMApplicationName(selectedBDM, contract.label),
    ]);

    window.showInformationMessage(Constants.informationMessage.bdm.bdmApplicationNotReady);

    const [abiUrl, bytecodeUrl] = await this.getBlobUrls(applicationName, storageAccountResourceExplorer, selectedBDM, [
      abi,
      byteCode,
    ]);

    return this.createBDMApplication(applicationName, selectedBDM, bytecodeUrl, abiUrl);
  }

  private getFiles(dir: string, filetype: string): string[] {
    const files: string[] = [];
    const directoryFiles = fs.readdirSync(dir);

    directoryFiles.map((file) => {
      const name = path.join(dir, file);

      if (fs.statSync(name).isDirectory()) {
        files.push(...this.getFiles(name, filetype));
      } else if (!filetype || path.extname(file) === filetype) {
        files.push(file);
      }
    });

    return files;
  }

  private async getBlobUrls(
    applicationName: string,
    storageAccountResourceExplorer: StorageAccountResourceExplorer,
    bdm: BlockchainDataManagerProject,
    content: string[]
  ): Promise<string[]> {
    const abiFileName = `${bdm.label}_${applicationName}_abi${Constants.contractExtension.json}`;
    const bytecodeFileName = `${bdm.label}_${applicationName}_bytecode${Constants.contractExtension.txt}`;
    const localFilePaths = await ContractService.getBuildFolderPath();

    return storageAccountResourceExplorer.getFileBlobUrls(
      content,
      [abiFileName, bytecodeFileName],
      localFilePaths,
      bdm.subscriptionId,
      bdm.resourceGroup
    );
  }

  private async createBDMApplication(
    applicationName: string,
    selectedBDM: BlockchainDataManagerProject,
    bytecodeUrl: string,
    abiUrl: string
  ): Promise<void> {
    await window.withProgress(
      { location: ProgressLocation.Window, title: Constants.statusBarMessages.createBDMApplication },
      async () => {
        const application = await this.createBlockchainDataManagerApplication(
          applicationName,
          selectedBDM,
          bytecodeUrl,
          abiUrl
        );

        selectedBDM.addChild(
          new BlockchainDataManagerNetworkNode(
            application.name,
            "*",
            selectedBDM.subscriptionId,
            selectedBDM.resourceGroup,
            [bytecodeUrl, abiUrl],
            ItemType.BLOCKCHAIN_DATA_MANAGER_APPLICATION,
            `${Constants.azureResourceExplorer.portalBasUri}${application.id}`
          )
        );
      }
    );
  }

  private async compiledAndDeployContracts(): Promise<void> {
    const answer = await window.showErrorMessage(
      Constants.informationMessage.bdm.contractMustBeDeployedForBDMApplication,
      Constants.informationMessage.compileAndDeployButton,
      Constants.informationMessage.cancelButton
    );

    if (answer === Constants.informationMessage.compileAndDeployButton) {
      await TruffleCommands.deployContracts();
    }

    throw new CancellationEvent();
  }

  private async createBlockchainDataManagerApplication(
    applicationName: string,
    bdm: BlockchainDataManagerProject,
    bytecodeUrl: string,
    abiUrl: string
  ): Promise<IAzureBlockchainDataManagerApplicationDto> {
    const subscriptionItem = await this.getSubscriptionItem(bdm.subscriptionId);
    const azureClient = await this.getAzureClient(subscriptionItem, new ResourceGroupItem(bdm.resourceGroup));

    const body: ICreateBlockchainDataManagerApplicationDto = {
      properties: {
        artifactType: Constants.bdmApplicationRequestParameters.artifactType,
        content: {
          abiFileUrl: abiUrl,
          bytecodeFileUrl: bytecodeUrl,
          queryTargetTypes: Constants.bdmApplicationRequestParameters.queryTargetTypes,
        },
      },
    };

    return azureClient.bdmResource.createBlockchainDataManagerApplication(bdm.label, applicationName, body);
  }

  private async getBDMApplicationName(bdm: BlockchainDataManagerProject, contractName: string): Promise<string> {
    const subscriptionItem = await this.getSubscriptionItem(bdm.subscriptionId);
    const azureClient = await this.getAzureClient(subscriptionItem, new ResourceGroupItem(bdm.resourceGroup));

    const applicationList = await azureClient.bdmResource.getBlockchainDataManagerApplicationList(bdm.label);
    const existingNames = applicationList.map((application) => application.name);

    return showInputBox({
      ignoreFocusOut: true,
      prompt: Constants.paletteLabels.enterApplicationName,
      validateInput: async (name) => {
        return AzureBlockchainServiceValidator.validateBDMApplicationName(name, existingNames);
      },
      value: contractName.toLowerCase(),
    });
  }

  private async getBlockchainDataManagerInstanceItems(
    azureClient: AzureBlockchainServiceClient,
    excludedItems: string[] = []
  ): Promise<QuickPickItem[]> {
    const items: QuickPickItem[] = [];

    const bdmItems = await this.loadBlockchainDataManagerInstanceItems(azureClient, excludedItems);

    items.push(...bdmItems);

    return items;
  }

  private async loadBlockchainDataManagerInstanceItems(
    azureClient: AzureBlockchainServiceClient,
    excludedItems: string[] = []
  ): Promise<BlockchainDataManagerInstanceItem[]> {
    const bdmItems = await azureClient.bdmResource.getBlockchainDataManagerList();

    return bdmItems
      .filter((item) => !excludedItems.includes(item.name))
      .map(
        (item) =>
          new BlockchainDataManagerInstanceItem(
            item.name,
            azureClient.subscriptionId,
            azureClient.resourceGroup,
            item.properties.uniqueId
          )
      )
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  private async getBlockchainDataManagerInstance(
    bdmInstanceItem: BlockchainDataManagerInstanceItem,
    azureClient: AzureBlockchainServiceClient
  ): Promise<BlockchainDataManagerProject> {
    const { bdmName, subscriptionId, resourceGroup } = bdmInstanceItem;

    const bdmProject = new BlockchainDataManagerProject(bdmName, subscriptionId, resourceGroup);
    const bdmApplications = await this.getBlockchainDataManagerApplications(bdmInstanceItem, azureClient);

    const bdmInputList = await azureClient.bdmResource.getBlockchainDataManagerInputList(bdmName);
    const bdmInputs = await this.getBlockchainDataManagerInputs(bdmInputList, subscriptionId, resourceGroup);

    const bdmOutputList = await azureClient.bdmResource.getBlockchainDataManagerOutputList(bdmName);
    const bdmOutputs = await this.getBlockchainDataManagerOutputs(bdmOutputList, subscriptionId, resourceGroup);

    bdmProject.setChildren([...bdmApplications, bdmInputs, bdmOutputs]);

    return bdmProject;
  }

  private async getBlockchainDataManagerApplications(
    bdmInstanceItem: BlockchainDataManagerInstanceItem,
    azureClient: AzureBlockchainServiceClient
  ): Promise<BlockchainDataManagerNetworkNode[]> {
    const { bdmName, subscriptionId, resourceGroup } = bdmInstanceItem;

    const bdmApplicationList = await azureClient.bdmResource.getBlockchainDataManagerApplicationList(bdmName);

    return bdmApplicationList.map((application) => {
      const { abiFileUrl, bytecodeFileUrl } = application.properties.content;
      const indexRemovingRoute = application.id.lastIndexOf("/artifacts");
      const url = `${Constants.azureResourceExplorer.portalBasUri}/resource${application.id.slice(
        0,
        indexRemovingRoute
      )}/blockchainapplications`;

      return new BlockchainDataManagerNetworkNode(
        application.name,
        "*",
        subscriptionId,
        resourceGroup,
        [abiFileUrl, bytecodeFileUrl],
        ItemType.BLOCKCHAIN_DATA_MANAGER_APPLICATION,
        url
      );
    });
  }

  private async getBlockchainDataManagerInputs(
    bdmInputList: IAzureBlockchainDataManagerInputDto[],
    subscriptionId: string,
    resourceGroup: string
  ): Promise<BlockchainDataManagerInputAndOutput> {
    const bdmInputs = bdmInputList.map((input) => {
      return new BlockchainDataManagerNetworkNode(
        input.name,
        "*",
        subscriptionId,
        resourceGroup,
        [],
        ItemType.BLOCKCHAIN_DATA_MANAGER_INPUT,
        this.getTransactionNodeExternalUrl(input.properties.dataSource.resourceId)
      );
    });

    const inputs = new BlockchainDataManagerInputAndOutput(
      ItemType.BLOCKCHAIN_DATA_MANAGER_INPUT_GROUP,
      Constants.treeItemData.group.bdm.input.label
    );

    inputs.setChildren(bdmInputs);

    return inputs;
  }

  private async getBlockchainDataManagerOutputs(
    bdmOutputList: IAzureBlockchainDataManagerOutputDto[],
    subscriptionId: string,
    resourceGroup: string
  ): Promise<BlockchainDataManagerInputAndOutput> {
    const bdmOutputs = bdmOutputList.map((output) => {
      const indexRemovingRoute = output.id.lastIndexOf("/outputs");
      const url = `${Constants.azureResourceExplorer.portalBasUri}/resource${output.id.slice(
        0,
        indexRemovingRoute
      )}/outboundconnections`;
      return new BlockchainDataManagerNetworkNode(
        output.name,
        "*",
        subscriptionId,
        resourceGroup,
        [],
        ItemType.BLOCKCHAIN_DATA_MANAGER_OUTPUT,
        url
      );
    });

    const outputs = new BlockchainDataManagerInputAndOutput(
      ItemType.BLOCKCHAIN_DATA_MANAGER_OUTPUT_GROUP,
      Constants.treeItemData.group.bdm.output.label
    );

    outputs.setChildren(bdmOutputs);

    return outputs;
  }

  private async createBlockchainDataManagerInstance(
    azureClient: AzureBlockchainServiceClient,
    bdmItems: IAzureBlockchainDataManagerDto[],
    location: string,
    memberName: string,
    transactionNodeName: string,
    eventGridUrl: string
  ): Promise<BlockchainDataManagerProject> {
    const { bdmResource, subscriptionId, resourceGroup } = azureClient;

    const bodyParamsForCreateBDM: ICreateBlockchainDataManagerDto = {
      location,
      properties: {
        sku: "",
        state: Constants.provisioningState.stopped,
      },
    };

    const bodyParamsForCreateBDMInput: ICreateBlockchainDataManagerInputDto = {
      properties: {
        dataSource: {
          enableBackfilling: "False",
          resourceId: this.getTransactionNodeUrl(subscriptionId, resourceGroup, memberName, transactionNodeName),
        },
        inputType: "Ethereum",
      },
    };

    const bodyParamsForCreateBDMOutput: ICreateBlockchainDataManagerOutputDto = {
      properties: {
        dataSource: {
          resourceId: eventGridUrl,
        },
        outputType: "EventGrid",
      },
    };

    const connectionName = await this.getBlockchainDataManagerConnectionName();
    const bdmName = await this.getBlockchainDataManagerName(bdmItems);

    return await window.withProgress(
      {
        location: ProgressLocation.Window,
        title: `${Constants.statusBarMessages.creatingBlockchainDataManager} - ${bdmName}`,
      },
      async () => {
        const createdBDM = await bdmResource.createBlockchainDataManager(bdmName, bodyParamsForCreateBDM);
        const createdInput = await bdmResource.createBlockchainDataManagerInput(
          bdmName,
          transactionNodeName,
          bodyParamsForCreateBDMInput
        );
        const createdOutput = await bdmResource.createBlockchainDataManagerOutput(
          bdmName,
          connectionName,
          bodyParamsForCreateBDMOutput
        );
        await this.startBlockchainDataManager(bdmResource, createdBDM.id, bdmName);

        const bdmProject = new BlockchainDataManagerProject(bdmName, subscriptionId, resourceGroup);
        const bdmInputs = await this.getBlockchainDataManagerInputs([createdInput], subscriptionId, resourceGroup);
        const bdmOutputs = await this.getBlockchainDataManagerOutputs([createdOutput], subscriptionId, resourceGroup);

        bdmProject.setChildren([bdmInputs, bdmOutputs]);

        return bdmProject;
      }
    );
  }

  private async startBlockchainDataManager(
    bdmResource: BlockchainDataManagerResource,
    url: string,
    bdmName: string
  ): Promise<void> {
    await bdmResource.startBlockchainDataManager(bdmName);
    open(`${Constants.azureResourceExplorer.portalBasUri}/resource/${url}`);
  }

  private getBlockchainDataManagerConnectionName(): Promise<string> {
    return showInputBox({
      ignoreFocusOut: true,
      prompt: Constants.paletteLabels.enterConnectionName,
      validateInput: (name: string) => {
        if (!name || !name.match(Constants.validationRegexps.forbiddenChars.outboundConnectionName)) {
          return Constants.validationMessages.forbiddenChars.outboundConnectionName;
        }

        return;
      },
    });
  }

  private getBlockchainDataManagerName(bdmItems: IAzureBlockchainDataManagerDto[]): Promise<string> {
    return showInputBox({
      ignoreFocusOut: true,
      prompt: Constants.paletteLabels.enterBlockchainDataManagerName,
      validateInput: (name: string) => {
        if (!name || !name.match(Constants.validationRegexps.specialChars.bdmName)) {
          return Constants.validationMessages.invalidBlockchainDataManagerName;
        }

        if (bdmItems.some((bdm) => bdm.name === name)) {
          return Constants.validationMessages.bdmNameAlreadyExists;
        }

        return;
      },
    });
  }

  private getTransactionNodeName(transactionNodeItems: TransactionNodeItem[]): Promise<string> {
    return showInputBox({
      ignoreFocusOut: true,
      prompt: Constants.paletteLabels.enterTransactionNodeName,
      validateInput: (name: string) => {
        if (!name || !name.match(Constants.validationRegexps.specialChars.transactionNodeName)) {
          return Constants.validationMessages.invalidAzureName;
        }

        if (transactionNodeItems.some((tn) => tn.label === name)) {
          return Constants.validationMessages.transactionNodeNameAlreadyExists;
        }

        return;
      },
    });
  }

  private getEventGridName(eventGridList: EventGridItem[]): Promise<string> {
    return showInputBox({
      ignoreFocusOut: true,
      prompt: Constants.paletteLabels.enterEventGridName,
      validateInput: (name: string) => {
        if (!name || !name.match(Constants.validationRegexps.specialChars.eventGridName)) {
          return Constants.validationMessages.invalidEventGridName;
        }

        if (eventGridList.some((eg) => eg.label.toLocaleLowerCase() === name.toLocaleLowerCase())) {
          return Constants.validationMessages.eventGridAlreadyExists;
        }

        return;
      },
    });
  }

  private async getSelectedConsortium(
    consortiumResourceExplorer: ConsortiumResourceExplorer,
    azureClient: AzureBlockchainServiceClient
  ): Promise<QuickPickItem> {
    Telemetry.sendEvent("BlockchainDataManagerResourceExplorer.getSelectedConsortium.selectConsortium");

    const consortiumItems = await consortiumResourceExplorer.loadConsortiumItems(azureClient);
    const filteredConsortia = consortiumItems.filter((con) =>
      Constants.availableBlockchainDataManagerLocations.includes(con.location)
    );

    const quickPickItems = filteredConsortia.length
      ? filteredConsortia
      : [{ label: Constants.uiCommandStrings.createConsortium }];

    return showQuickPick(quickPickItems, {
      placeHolder: Constants.placeholders.selectConsortium,
      ignoreFocusOut: true,
    });
  }

  private async getSelectedMember(
    consortiumResourceExplorer: ConsortiumResourceExplorer,
    azureClient: AzureBlockchainServiceClient,
    memberName: string
  ): Promise<QuickPickItem> {
    Telemetry.sendEvent("BlockchainDataManagerResourceExplorer.getSelectedMember.selectMember");

    const members = await consortiumResourceExplorer.loadMemberItems(azureClient, memberName);
    const memberItems: QuickPickItem[] = members.map((member) => ({ label: member.name }));

    return showQuickPick(memberItems, { placeHolder: Constants.placeholders.selectMember, ignoreFocusOut: true });
  }

  private async getSelectedTransactionNode(
    azureClient: AzureBlockchainServiceClient,
    bdmItems: IAzureBlockchainDataManagerDto[],
    selectedMemberName: string,
    location: string
  ): Promise<TransactionNodeItem> {
    Telemetry.sendEvent("BlockchainDataManagerResourceExplorer.getSelectedTransactionNode.selectTransactionNode");

    const { bdmResource, transactionNodeResource } = azureClient;
    let transactionNodeItems: TransactionNodeItem[] = [];
    let filteredTransactionNode: TransactionNodeItem[] = [];

    await window.withProgress(
      {
        location: ProgressLocation.Window,
        title: `Getting transaction nodes for member - ${selectedMemberName}`,
      },
      async () => {
        const bdmInputList: IAzureBlockchainDataManagerInputDto[] = [];

        await Promise.all(bdmItems.map((bdm) => bdmResource.getBlockchainDataManagerInputList(bdm.name))).then(
          (result) => {
            result.forEach((inputs) => {
              if (inputs.length) {
                bdmInputList.push(...inputs);
              }
            });
          }
        );

        const transactionNodes = await transactionNodeResource.getTransactionNodeList(selectedMemberName);
        const defaultTransactionNode = await transactionNodeResource.getTransactionNode(
          selectedMemberName,
          Constants.defaultInputNameInBdm
        );
        defaultTransactionNode.name = selectedMemberName;

        transactionNodeItems = [defaultTransactionNode, ...transactionNodes].map(
          (tn) => new TransactionNodeItem(tn.name, tn.id, tn.properties.provisioningState)
        );

        filteredTransactionNode = transactionNodeItems.filter(
          (tn) =>
            tn.provisioningState === Constants.provisioningState.succeeded &&
            !bdmInputList.some((input) => input.properties.dataSource.resourceId === tn.url)
        );
      }
    );

    const selectedTransactionNode = await showQuickPick(
      [{ label: Constants.uiCommandStrings.createTransactionNode }, ...filteredTransactionNode],
      { placeHolder: Constants.placeholders.selectTransactionNode, ignoreFocusOut: true }
    );

    if (selectedTransactionNode instanceof TransactionNodeItem) {
      return selectedTransactionNode;
    }

    await this.createdTransactionNode(selectedMemberName, location, azureClient, transactionNodeItems);

    Telemetry.sendEvent(
      "BlockchainDataManagerResourceExplorer.getSelectedTransactionNode.cancellationCreatingTransactionNode"
    );
    throw new CancellationEvent();
  }

  private async getSelectedEventGrid(
    eventGridClient: EventGridManagementClient,
    location: string
  ): Promise<EventGridItem> {
    Telemetry.sendEvent("BlockchainDataManagerResourceExplorer.getSelectedEventGrid.selectEventGrid");

    const eventGridResourceExplore = new EventGridResourceExplorer();
    const eventGridList = await eventGridResourceExplore.loadEventGridItems(eventGridClient);

    const selectedEventGrid = await showQuickPick(
      [{ label: Constants.uiCommandStrings.createEventGrid }, ...eventGridList],
      { placeHolder: Constants.placeholders.selectEventGrid, ignoreFocusOut: true }
    );

    if (selectedEventGrid instanceof EventGridItem) {
      return selectedEventGrid;
    }

    await this.getCreatedEventGrid(eventGridClient, location, eventGridList);

    Telemetry.sendEvent("BlockchainDataManagerResourceExplorer.getSelectedEventGrid.cancellationCreatingEventGrid");
    throw new CancellationEvent();
  }

  private async getCreatedEventGrid(
    eventGridClient: EventGridManagementClient,
    location: string,
    eventGridList: EventGridItem[]
  ): Promise<void> {
    Telemetry.sendEvent("BlockchainDataManagerResourceExplorer.getCreatedEventGrid.createEventGrid");

    const bodyParamsForCreateEventGrid: ICreateEventGridDto = { location };

    const eventGridName = await this.getEventGridName(eventGridList);
    const eventGrid = await eventGridClient.eventGridResource.createEventGrid(
      eventGridName,
      JSON.stringify(bodyParamsForCreateEventGrid)
    );

    showNotification({
      message: Constants.informationMessage.provisioningResource(Constants.azureBlockchainResourceName.eventGrid),
      type: NotificationOptions.info,
    });
    open(`${Constants.azureResourceExplorer.portalBasUri}/resource/${eventGrid.id}`);
  }

  private async createdTransactionNode(
    memberName: string,
    location: string,
    azureClient: AzureBlockchainServiceClient,
    transactionNodeItems: TransactionNodeItem[]
  ): Promise<void> {
    Telemetry.sendEvent("BlockchainDataManagerResourceExplorer.createdTransactionNode.createTransactionNode");

    const transactionNodeName = await this.getTransactionNodeName(transactionNodeItems);
    const transactionNodePassword = await showInputBox({
      ignoreFocusOut: true,
      password: true,
      prompt: Constants.paletteLabels.enterTransactionNodePassword,
      validateInput: AzureBlockchainServiceValidator.validateAccessPassword,
    });

    const bodyParamsTransactionNode: ICreateTransactionNodeDto = {
      location,
      properties: {
        password: transactionNodePassword,
      },
    };

    const createdTransactionNode = await azureClient.transactionNodeResource.createTransactionNode(
      memberName,
      transactionNodeName,
      bodyParamsTransactionNode
    );

    showNotification({
      message: Constants.informationMessage.provisioningResource(Constants.azureBlockchainResourceName.transactionNode),
      type: NotificationOptions.info,
    });
    open(this.getTransactionNodeExternalUrl(createdTransactionNode.id));
  }

  private getTransactionNodeUrl(
    subscriptionId: string,
    resourceGroup: string,
    memberName: string,
    transactionNodeName: string
  ): string {
    return (
      `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/` +
      `providers/Microsoft.Blockchain/blockchainMembers/${memberName}/transactionNodes/${transactionNodeName}`
    );
  }

  private getTransactionNodeExternalUrl(url: string): string {
    const firstMark = "blockchainMembers/";
    const nodeName = "nodeName";

    const idxOfMemberAndTransactionNode = url.lastIndexOf(firstMark) + firstMark.length;
    const relativeInternalPath = url.substring(0, idxOfMemberAndTransactionNode).replace(/\//g, "%2F");
    let memberAndTransactionNode = url.substring(idxOfMemberAndTransactionNode).replace("transactionNodes", nodeName);

    if (memberAndTransactionNode.includes(Constants.defaultInputNameInBdm)) {
      const memberName = memberAndTransactionNode.substring(0, memberAndTransactionNode.indexOf("/" + nodeName));
      memberAndTransactionNode = memberAndTransactionNode.replace(Constants.defaultInputNameInBdm, memberName);
    }

    return (
      `${Constants.azureResourceExplorer.portalBladeUri}/overview/memberResourceId/` +
      relativeInternalPath +
      memberAndTransactionNode
    );
  }

  private async getAzureClient(
    subscriptionItem: SubscriptionItem,
    resourceGroupItem: ResourceGroupItem
  ): Promise<AzureBlockchainServiceClient> {
    return new AzureBlockchainServiceClient(
      subscriptionItem.session.credentials,
      subscriptionItem.subscriptionId,
      resourceGroupItem.label,
      resourceGroupItem.description,
      Constants.azureResourceExplorer.requestBaseUri,
      {
        acceptLanguage: Constants.azureResourceExplorer.requestAcceptLanguage,
        filters: [],
        generateClientRequestId: true,
        longRunningOperationRetryTimeout: 30,
        noRetryPolicy: false,
        requestOptions: {
          customHeaders: {},
        },
        rpRegistrationRetryTimeout: 30,
      }
    );
  }

  private async getEventGridClient(
    subscriptionItem: SubscriptionItem,
    resourceGroupItem: ResourceGroupItem
  ): Promise<EventGridManagementClient> {
    return new EventGridManagementClient(
      subscriptionItem.session.credentials,
      subscriptionItem.subscriptionId,
      resourceGroupItem.label,
      resourceGroupItem.description,
      Constants.azureResourceExplorer.requestBaseUri,
      {
        acceptLanguage: Constants.azureResourceExplorer.requestAcceptLanguage,
        filters: [],
        generateClientRequestId: true,
        longRunningOperationRetryTimeout: 30,
        noRetryPolicy: false,
        requestOptions: {
          customHeaders: {},
        },
        rpRegistrationRetryTimeout: 30,
      }
    );
  }
}
