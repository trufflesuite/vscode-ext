// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { mkdirp, readdir, readJson, writeFile } from 'fs-extra';
import * as path from 'path';
import { QuickPickItem, Uri, window } from 'vscode';
import { Constants } from '../Constants';
import { getWorkspaceRoot } from '../helpers';
import { showInputBox, showQuickPick } from '../helpers/userInteraction';
import { ResourceGroupItem, SubscriptionItem } from '../Models';
import { Output } from '../Output';
import { ResourceExplorerAndGenerator } from '../ResourceExplorerAndGenerator';
import { buildContract } from './AbiDeserialiser';
import './Nethereum.Generators.DuoCode';

export class LogicAppGenerator extends ResourceExplorerAndGenerator {
  public async generateMicroservicesWorkflows(filePath: Uri | undefined): Promise<void> {
    return this.generateWorkflows(Constants.microservicesWorkflows.Service, filePath);
  }

  public async generateDataPublishingWorkflows(filePath: Uri | undefined): Promise<void> {
    return this.generateWorkflows(Constants.microservicesWorkflows.Data, filePath);
  }

  public async generateEventPublishingWorkflows(filePath: Uri | undefined): Promise<void> {
    return this.generateWorkflows(Constants.microservicesWorkflows.Messaging, filePath);
  }

  public async generateReportPublishingWorkflows(filePath: Uri | undefined): Promise<void> {
    return this.generateWorkflows(Constants.microservicesWorkflows.Reporting, filePath);
  }

  private async generateWorkflows(workflowType: string, filePath: Uri | undefined): Promise<void> {
    const dirPath: string = path.join(getWorkspaceRoot(), 'build/contracts');

    if (filePath) {
      const fileName = path.basename(filePath.fsPath);
      const contractName = fileName.Remove(fileName.length - 4);
      const compiledContractPath = path.join(dirPath, `${contractName}.json`);
      const picks = this.getLogicAppItems(workflowType);
      const serviceTypeSelection: string = (await showQuickPick(picks, { })).label;
      const serviceType: int = this.getServiceTypeFromString(serviceTypeSelection);
      const contractAddress: string = await showInputBox({ value: 'contract address' });
      const [subscriptionItem, resourceGroupItem] = await this.selectSubscriptionAndResourceGroup();
      readJson(compiledContractPath, {encoding: 'utf8'},
        async (err2: Error, contents: any) => await this.handleContractJsonFile(
          err2,
          contents,
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

    const picks = this.getLogicAppItems(workflowType);
    const serviceTypeSelection: string = (await showQuickPick(picks, { })).label;
    const serviceType: int = this.getServiceTypeFromString(serviceTypeSelection);
    const contractAddress: string = await showInputBox({ value: 'contract address' });
    const [subscriptionItem, resourceGroupItem] = await this.selectSubscriptionAndResourceGroup();
    files.forEach((file) => {
      readJson(dirPath + file, {encoding: 'utf8'},
        async (err2: Error, contents: any) => await this.handleContractJsonFile(
          err2,
          contents,
          contractAddress,
          subscriptionItem,
          resourceGroupItem,
          workflowType,
          serviceType,
        ));
    });

    window.showInformationMessage('Generated the logic app!');
  }

  private getLogicAppItems(workflowType: string): QuickPickItem[] {
    if (workflowType === Constants.microservicesWorkflows.Service) {
      return [
        { label: Constants.logicApp.LogicApp },
        { label: Constants.logicApp.FlowApp },
        { label: Constants.logicApp.AzureFunction },
      ];
    } else {
      return [
        { label: Constants.logicApp.LogicApp },
        { label: Constants.logicApp.FlowApp },
      ];
    }
  }

  private getServiceTypeFromString(serviceTypeSelection: string): int {
    if (serviceTypeSelection === Constants.logicApp.LogicApp) {
      return 1;
    } else if (serviceTypeSelection === Constants.logicApp.FlowApp) {
      return 0;
    } else if (serviceTypeSelection === Constants.logicApp.AzureFunction) {
      return 2;
    } else {
      throw new Error('Service type string not valid');
    }
  }

  private async handleContractJsonFile(
    err: Error,
    contents: any,
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
      this.getOutputDir(serviceType),
      contractAddress,
      subscriptionItem,
      resourceGroupItem.description,
      workflowType,
      serviceType);
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
    if (workflowType === Constants.microservicesWorkflows.Service) {
      generator = new Nethereum.Generators.ServiceWorkflow.ServiceWorkflowProjectGenerator(
        buildContract(JSON.stringify(contract.abi)),
        contract.contractName,
        contract.bytecode,
        contract.contractName,
        contract.contractName + `.${workflowType}`,
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
    } else if (workflowType === Constants.microservicesWorkflows.Data) {
      generator = new Nethereum.Generators.DataWorkflow.DataWorkflowProjectGenerator(
        buildContract(JSON.stringify(contract.abi)),
        contract.contractName,
        contract.bytecode,
        contract.contractName,
        contract.contractName + `.${workflowType}`,
        dirPath,
        '/',
        serviceType,
        0,
        contractAddress,
        subscription.subscriptionId || String.Empty,
        location,
        JSON.stringify(contract.abi),
      );
    } else if (workflowType === Constants.microservicesWorkflows.Messaging) {
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
        contract.contractName + `.${workflowType}`,
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
    } else if (workflowType === Constants.microservicesWorkflows.Reporting) {
      generator = new Nethereum.Generators.ReportingWorkflow.ReportingWorkflowProjectGenerator(
        buildContract(JSON.stringify(contract.abi)),
        contract.contractName,
        contract.bytecode,
        contract.contractName,
        contract.contractName + `.${workflowType}`,
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

  private getOutputDir(serviceType: int): string {
    switch (serviceType) {
      case 0:
        return path.join(getWorkspaceRoot(), Constants.flowAppOutputDir);
      case 1:
        return path.join(getWorkspaceRoot(), Constants.logicAppOutputDir);
      case 2:
        return path.join(getWorkspaceRoot(), Constants.azureFunctionOutputDir);
      default:
        throw new Error('Invalid service type.');
    }
  }

  private async selectSubscriptionAndResourceGroup(): Promise<[SubscriptionItem, ResourceGroupItem]> {
    await this.waitForLogin();

    const subscriptionItem = await this.getOrSelectSubscriptionItem();
    const resourceGroupItem = await this.getOrCreateResourceGroupItem(subscriptionItem);

    return [subscriptionItem, resourceGroupItem];
  }
}
