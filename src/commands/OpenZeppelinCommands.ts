// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import open = require('open');
import { ProgressLocation, window } from 'vscode';
import { Constants } from '../Constants';
import { showQuickPick } from '../helpers';
import { Output } from '../Output';
import {
  IOZAsset,
  IOZContractCategory,
  OpenZeppelinMigrationsService,
  OpenZeppelinService,
  PromiseState,
} from '../services';
import { Telemetry } from '../TelemetryClient';

export namespace OpenZeppelinCommands {
  export async function addCategory(): Promise<void> {
    Telemetry.sendEvent('OpenZeppelinCommands.addCategory');
    const categories = OpenZeppelinService.getCategories();
    const category = await selectCategory(categories);
    Telemetry.sendEvent('OpenZeppelinCommands.addCategory.selected', { name: category.name });
    const fullAssetWithDependencies = OpenZeppelinService.collectAssetsWithDependencies(category.assets);
    Output.outputLine(
      Constants.outputChannel.azureBlockchain,
      Constants.openZeppelin.categoryWillDownloaded(category.name),
    );
    const assetStatuses = OpenZeppelinService.getAssetsStatus(fullAssetWithDependencies);
    Output.outputLine(
      Constants.outputChannel.azureBlockchain,
      Constants.openZeppelin.fileNow(assetStatuses.existing.length),
    );

    if (assetStatuses.existing.length > 0) {
      const answer = await window.showInformationMessage(
        Constants.openZeppelin.alreadyExisted(assetStatuses.existing),
        Constants.openZeppelin.replaceButtonTitle,
        Constants.openZeppelin.skipButtonTitle,
      );

      Telemetry.sendEvent('OpenZeppelinCommands.addCategory.overwriteExistedDialog', { name: answer || '' });
      if (answer === Constants.openZeppelin.replaceButtonTitle) {
        Output.outputLine(
          Constants.outputChannel.azureBlockchain,
          Constants.openZeppelin.overwriteExistedContracts,
        );
        await downloadFileSetWithProgress(fullAssetWithDependencies, true);
      } else {
        await downloadFileSetWithProgress(assetStatuses.missing, false);
      }
    } else {
      await downloadFileSetWithProgress(fullAssetWithDependencies, false);
    }
    openDocumentationUrl(category);
    Telemetry.sendEvent('OpenZeppelinCommands.addCategory.generateMigrations');
    await OpenZeppelinMigrationsService.generateMigrations(await OpenZeppelinService.getAllDownloadedAssets());
  }
}

async function downloadFileSetWithProgress(assets: IOZAsset[], overwrite: boolean = false): Promise<void> {
  return window.withProgress({
    location: ProgressLocation.Notification,
    title: Constants.openZeppelin.downloadingContractsFromOpenZeppelin,
  }, async () => downloadFileSet(assets, overwrite),
  );
}

async function downloadFileSet(assets: IOZAsset[], overwrite: boolean): Promise<void> {
  const results = await OpenZeppelinService.downloadFiles(assets, overwrite);

  const downloaded = results
    .filter((result) => result.state === PromiseState.fulfilled)
    .map((result) => result.asset);

  const rejected = results
    .filter((result) => result.state === PromiseState.rejected)
    .map((result) => result.asset);
  Telemetry.sendEvent(
    'OpenZeppelinCommands.downloadFileSet.result',
    { downloadedCount: downloaded.length.toString(), rejectedCount: rejected.length.toString() },
  );

  if (downloaded.length > 0) {
    await OpenZeppelinService.addAssetsToProjectJson(downloaded);
    window.showInformationMessage(Constants.openZeppelin.wereDownloaded(downloaded.length));
  }

  if (rejected.length > 0) {
    const answer = await window.showErrorMessage(
      Constants.openZeppelin.wereNotDownloaded(rejected.length),
      Constants.openZeppelin.retryButtonTitle,
      Constants.openZeppelin.cancelButtonTitle,
    );
    if (answer === Constants.openZeppelin.retryButtonTitle) {
      Output.outputLine(
        Constants.outputChannel.azureBlockchain,
        Constants.openZeppelin.retryDownloading,
      );
      Telemetry.sendEvent('OpenZeppelinCommands.downloadFileSet.retry', { assetsCount: rejected.length.toString() });
      await downloadFileSet(rejected, overwrite);
    }
  }
}

async function selectCategory(categories: IOZContractCategory[]): Promise<IOZContractCategory> {
  return showQuickPick(
    categories.map((category: IOZContractCategory) => {
      return {
        ...category,
        label: category.name,
      };
    }),
    {
      ignoreFocusOut: true,
      placeHolder: Constants.openZeppelin.selectCategoryForDownloading,
    },
  );
}

async function openDocumentationUrl(category: IOZContractCategory): Promise<void> {
  const answer = await window.showInformationMessage(
    Constants.openZeppelin.exploreDownloadedContractsInfo,
    Constants.openZeppelin.moreDetailsButtonTitle,
    Constants.openZeppelin.cancelButtonTitle);

  if (answer === Constants.openZeppelin.moreDetailsButtonTitle) {
    const documentationUrl = OpenZeppelinService.getCategoryApiDocumentationUrl(category);
    open(documentationUrl);
  }
}
