// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Uri } from 'vscode';
import { LogicAppGenerator } from '../Generators/LogicAppGenerator';

export namespace LogicAppCommands {
  export async function generateMicroservicesWorkflows(filePath: Uri | undefined): Promise<void> {
    const generator = new LogicAppGenerator();
    return generator.generateMicroservicesWorkflows(filePath);
  }
  export async function generateDataPublishingWorkflows(filePath: Uri | undefined): Promise<void> {
    const generator = new LogicAppGenerator();
    return generator.generateDataPublishingWorkflows(filePath);
  }
  export async function generateEventPublishingWorkflows(filePath: Uri | undefined): Promise<void> {
    const generator = new LogicAppGenerator();
    return generator.generateEventPublishingWorkflows(filePath);
  }
  export async function generateReportPublishingWorkflows(filePath: Uri | undefined): Promise<void> {
    const generator = new LogicAppGenerator();
    return generator.generateReportPublishingWorkflows(filePath);
  }
}
