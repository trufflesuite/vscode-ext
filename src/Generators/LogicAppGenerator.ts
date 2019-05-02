import { ResourceManagementClient, ResourceModels } from 'azure-arm-resource';
import { mkdirp, readdir, readJson, writeFile } from 'fs-extra';
import * as path from 'path';
import { commands, extensions, QuickPickItem, Uri, window } from 'vscode';
import { AzureAccount } from '../azure-account.api';
import { Constants } from '../Constants';
import { getWorkspaceRoot } from '../helpers';
import { showInputBox, showQuickPick } from '../helpers/userInteraction';
import { ResourceGroupItem, SubscriptionItem } from '../Models';
import { Output } from '../Output';
import { buildContract } from './AbiDeserialiser';
import './Nethereum.Generators.DuoCode';

export class LogicAppGenerator {
  private readonly _accountApi: AzureAccount;

  constructor() {
    this._accountApi = extensions.getExtension<AzureAccount>('ms-vscode.azure-account')!.exports;
  }

  public async generateMicroservicesWorkflows(filePath: Uri | undefined): Promise<void> {
    return this.generateWorkflows('Service', filePath);
  }

  public async generateDataPublishingWorkflows(filePath: Uri | undefined): Promise<void> {
    return this.generateWorkflows('Data', filePath);
  }
  public async generateEventPublishingWorkflows(filePath: Uri | undefined): Promise<void> {
    return this.generateWorkflows('Messaging', filePath);
  }

  public async generateReportPublishingWorkflows(filePath: Uri | undefined): Promise<void> {
    return this.generateWorkflows('Reporting', filePath);
  }

  private async generateWorkflows(workflowType: string, filePath: Uri | undefined): Promise<void> {
    const workspaceDir: Uri = Uri.parse(getWorkspaceRoot());
    const dirPath: string = workspaceDir.fsPath + '/build/contracts/';

    if (filePath) {
      const fileName = path.basename(filePath.fsPath);
      const contractName = fileName.Remove(fileName.length - 4);
      const compiledContractPath = dirPath + contractName + '.json';

      const picks: QuickPickItem[] = [
        { label: 'Logic App' },
        { label: 'Flow App' },
        { label: 'Azure Function' },
      ];

      const serviceTypeSelection: string = (await showQuickPick(picks, { })).label;
      const serviceType: int = this.getServiceTypeFromString(serviceTypeSelection);
      const contractAddress: string = await showInputBox({ value: 'contract address' });
      const [subscriptionItem, resourceGroupItem] = await this.selectSubscriptionAndResourceGroup();
      readJson(compiledContractPath, {encoding: 'utf8'},
        async (err2: Error, contents: any) => await this.handleContractJsonFile(
          err2,
          contents,
          dirPath,
          contractAddress,
          subscriptionItem,
          resourceGroupItem,
          workflowType,
          serviceType,
        ));
    } else {
      readdir(dirPath, (err: Error, files: string[]) =>
        this.iterateFilesInDirectory(err, files, dirPath, workflowType));
    }
  }

  private async iterateFilesInDirectory(err: Error, files: string[], dirPath: string, workflowType: string) {
    if (err) {
      Output.outputLine(Constants.outputChannel.logicAppGenerator, err.toString());
      return;
    }

    const picks: QuickPickItem[] = [
      { label: 'Logic App' },
      { label: 'Flow App' },
      { label: 'Azure Function' },
    ];

    const serviceTypeSelection: string = (await showQuickPick(picks, { })).label;
    const serviceType: int = this.getServiceTypeFromString(serviceTypeSelection);
    const contractAddress: string = await showInputBox({ value: 'contract address' });
    const [subscriptionItem, resourceGroupItem] = await this.selectSubscriptionAndResourceGroup();
    files.forEach((file) => {
      readJson(dirPath + file, {encoding: 'utf8'},
        async (err2: Error, contents: any) => await this.handleContractJsonFile(
          err2,
          contents,
          dirPath,
          contractAddress,
          subscriptionItem,
          resourceGroupItem,
          workflowType,
          serviceType,
        ));
    });

    window.showInformationMessage('Generated the logic app!');
  }

  private getServiceTypeFromString(serviceTypeSelection: string): int {
    if (serviceTypeSelection === 'Logic App') {
      return 1;
    } else if (serviceTypeSelection === 'Flow App') {
      return 0;
    } else if (serviceTypeSelection === 'Azure Function') {
      return 2;
    } else {
      throw new Error('Service type string not valid');
    }
  }

  private async handleContractJsonFile(
    err: Error,
    contents: any,
    dirPath: string,
    contractAddress: string,
    subscriptionItem: SubscriptionItem,
    resourceGroupItem: ResourceGroupItem,
    workflowType: string,
    serviceType: int) {
    if (err) {
      Output.outputLine(Constants.outputChannel.logicAppGenerator, err.toString());
      return;
    }
    await this.createLogicAppFromAbi(contents,
      dirPath,
      contractAddress,
      subscriptionItem,
      resourceGroupItem.description,
      workflowType,
      serviceType);
    Output.outputLine(Constants.outputChannel.logicAppGenerator, contents.abi.toString());

  }

  private async createLogicAppFromAbi(
    contract: any,
    dirPath: string,
    contractAddress: string,
    subscription: SubscriptionItem,
    location: string,
    workflowType: string,
    serviceType: int) {

    let generator;
    if (workflowType === 'Service') {
      generator = new Nethereum.Generators.ServiceWorkflow.ServiceWorkflowProjectGenerator(
        buildContract(JSON.stringify(contract.abi)),
        contract.contractName,
        contract.bytecode,
        contract.contractName,
        contract.contractName + '.Service',
        dirPath,
        '/',
        serviceType,
        0,
        JSON.stringify(contract.abi),
        contractAddress,
        subscription.subscriptionId || String.Empty,
        location,
        '',
      );
    } else if (workflowType === 'Data') {
      generator = new Nethereum.Generators.DataWorkflow.DataWorkflowProjectGenerator(
        buildContract(JSON.stringify(contract.abi)),
        contract.contractName,
        contract.bytecode,
        contract.contractName,
        contract.contractName + '.Data',
        dirPath,
        '/',
        serviceType,
        0,
        contractAddress,
        subscription.subscriptionId || String.Empty,
        location,
        JSON.stringify(contract.abi),
      );
    } else if (workflowType === 'Messaging') {
      const topicName: string = await showInputBox({ value: 'topic name' });
      const picks: QuickPickItem[] = [
        { label: 'Service Bus' },
        { label: 'Event Grid' },
      ];
      const messagingType: string = (await showQuickPick(picks, {})).label;

      generator = new Nethereum.Generators.MessagingWorkflow.MessagingWorkflowProjectGenerator(
        buildContract(JSON.stringify(contract.abi)),
        contract.contractName,
        contract.bytecode,
        contract.contractName,
        contract.contractName + '.Messaging',
        dirPath,
        '/',
        serviceType,
        0,
        contractAddress,
        subscription.subscriptionId || String.Empty,
        location,
        JSON.stringify(contract.abi),
        topicName,
        this.getMessagingType(messagingType),
      );
    } else if (workflowType === 'Reporting') {
      generator = new Nethereum.Generators.ReportingWorkflow.ReportingWorkflowProjectGenerator(
        buildContract(JSON.stringify(contract.abi)),
        contract.contractName,
        contract.bytecode,
        contract.contractName,
        contract.contractName + '.Reporting',
        dirPath,
        '/',
        serviceType,
        0,
        contractAddress,
        subscription.subscriptionId || String.Empty,
        location,
        JSON.stringify(contract.abi),
      );
    }
    if (generator) {
      const files: any[] = generator.GenerateAll();
      files.forEach(this.writeFile);
    } else {
      throw new Error('workflowType does not match any available workflows');
    }
  }

  private getMessagingType(messagingType: string): any {
    if (messagingType === 'Service Bus') {
      return 1;
    } else if (messagingType === 'Event Grid') {
      return 0;
    } else {
      throw new Error('messaging type not defined');
    }
  }

  private writeFile(file: Nethereum.Generators.Core.GeneratedFile): void {
    const filePath = file.get_OutputFolder() + '/' + file.get_FileName();
    mkdirp(path.dirname(filePath), (err: any) => {
      if (err) { throw err; }
      writeFile(filePath, file.get_GeneratedCode(), (err2: any) => {
        if (err2) {
          throw err2;
        }
        Output.outputLine(Constants.outputChannel.logicAppGenerator, 'Saved file to ' + filePath);
      });
    });
  }

  private async selectSubscriptionAndResourceGroup(): Promise<[SubscriptionItem, ResourceGroupItem]> {
    await this.waitForLogin();

    const subscriptionItem = await this.getOrSelectSubscriptionItem();
    const resourceGroupItem = await this.getOrCreateResourceGroup(subscriptionItem);

    return [subscriptionItem, resourceGroupItem];
  }

  private async getOrSelectSubscriptionItem(): Promise<SubscriptionItem> {
    return await showQuickPick(
      await this.loadSubscriptionItems(),
      { placeHolder: Constants.placeholders.selectSubscription, ignoreFocusOut: true },
    );
  }

  private async loadSubscriptionItems(): Promise<SubscriptionItem[]> {
    await this._accountApi.waitForFilters();

    const subscriptionItems = this._accountApi.filters
      .map((filter: any) => new SubscriptionItem(filter.subscription.displayName,
        filter.subscription.subscriptionId, filter.session));

    if (subscriptionItems.length === 0) {
      throw new Error('No subscription found, click an Azure account at the \
                bottom left corner and choose Select All.');
    }

    return subscriptionItems;
  }

  private async getOrCreateResourceGroup(subscriptionItem: SubscriptionItem): Promise<ResourceGroupItem> {
    return await showQuickPick(
      this.getResourceGroupItems(subscriptionItem),
      { placeHolder: Constants.placeholders.selectResourceGroup, ignoreFocusOut: true },
    );
  }

  private async getResourceGroupItems(subscriptionItem: SubscriptionItem): Promise<ResourceGroupItem[]> {
    // @ts-ignore
    const resourceManagementClient = new ResourceManagementClient(
      subscriptionItem.session.credentials,
      subscriptionItem.subscriptionId,
      subscriptionItem.session.environment.resourceManagerEndpointUrl,
    );
    const resourceGroups = await resourceManagementClient.resourceGroups.list();
    return resourceGroups.map((resourceGroup: ResourceModels.ResourceGroup) =>
      new ResourceGroupItem(resourceGroup.name, resourceGroup.location));
  }
  private async waitForLogin(): Promise<boolean> {
    let result = await this._accountApi.waitForLogin();
    if (!result) {
      await commands.executeCommand('azure-account.askForLogin');
      result = await this._accountApi.waitForLogin();
      if (!result) {
        throw new Error(Constants.errorMessageStrings.WaitForLogin);
      }
    }

    return true;
  }
}
