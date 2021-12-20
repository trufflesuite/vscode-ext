// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

// have to keep it this format.
import * as open from "open";
import {ProgressLocation, window} from "vscode";
import {Constants} from "../Constants";
import {openZeppelinHelper, showQuickPick} from "../helpers";
import {Output} from "../Output";
import {OpenZeppelinMigrationsService, OpenZeppelinService} from "../services";
import {IOZAsset, IOZContractCategory, PromiseState} from "../services/openZeppelin/models";
import {Telemetry} from "../TelemetryClient";

export namespace OpenZeppelinCommands {
  export async function addCategory(): Promise<void> {
    Telemetry.sendEvent("OpenZeppelinCommands.addCategory.commandStarted");

    const currentOZVersion = await openZeppelinHelper.tryGetCurrentOpenZeppelinVersionAsync();
    const manifest = await openZeppelinHelper.createManifestAsync(currentOZVersion);
    const categories = await manifest.getCategories();
    const category = await selectCategory(categories);

    Telemetry.sendEvent("OpenZeppelinCommands.addCategory.selected", {name: category.name});

    const baseUrl = manifest.getBaseUrlToContractsSource();
    const fullAssetWithDependencies = manifest.collectAssetsWithDependencies(category.assets);
    Output.outputLine(
      Constants.outputChannel.truffleSuiteForVSCode,
      Constants.openZeppelin.categoryWillDownloaded(category.name)
    );
    const assetsStatuses = await OpenZeppelinService.getAssetsStatus(fullAssetWithDependencies);
    Output.outputLine(
      Constants.outputChannel.truffleSuiteForVSCode,
      Constants.openZeppelin.fileNow(assetsStatuses.existing.length)
    );

    const downloadedAssets = await downloadOZFiles(
      baseUrl,
      assetsStatuses.existing,
      assetsStatuses.missing,
      fullAssetWithDependencies
    );

    const mergedAssets = await OpenZeppelinService.mergeAssetsWithExisting(downloadedAssets);

    await OpenZeppelinService.updateProjectJsonAsync(manifest.getVersion(), category, mergedAssets);

    openDocumentationUrl(manifest.getCategoryApiDocumentationUrl(category));

    Telemetry.sendEvent("OpenZeppelinCommands.addCategory.generateMigrations");

    await openZeppelinHelper.defineContractRequiredParameters();

    await OpenZeppelinMigrationsService.generateMigrations(await OpenZeppelinService.getAllDownloadedAssetsAsync());

    Telemetry.sendEvent("OpenZeppelinCommands.addCategory.commandFinished");
  }
}

async function downloadOZFiles(
  baseUrl: string,
  existing: IOZAsset[],
  missing: IOZAsset[],
  fullAssetWithDependencies: IOZAsset[]
): Promise<IOZAsset[]> {
  let downloadedAssets: IOZAsset[];

  if (existing.length > 0) {
    const answer = await window.showInformationMessage(
      Constants.openZeppelin.alreadyExisted(existing),
      Constants.openZeppelin.replaceButtonTitle,
      Constants.openZeppelin.skipButtonTitle
    );

    Telemetry.sendEvent("OpenZeppelinCommands.downloadOZFiles.overwriteExistedDialog", {name: answer || ""});
    if (answer === Constants.openZeppelin.replaceButtonTitle) {
      Output.outputLine(
        Constants.outputChannel.truffleSuiteForVSCode,
        Constants.openZeppelin.overwriteExistedContracts
      );
      downloadedAssets = await downloadFileSetWithProgress(baseUrl, fullAssetWithDependencies, true);
    } else {
      downloadedAssets = await downloadFileSetWithProgress(baseUrl, missing, false);
    }
  } else {
    downloadedAssets = await downloadFileSetWithProgress(baseUrl, fullAssetWithDependencies, false);
  }

  if (downloadedAssets.length) {
    window.showInformationMessage(Constants.openZeppelin.wereDownloaded(downloadedAssets.length));
  }

  return downloadedAssets;
}

async function downloadFileSetWithProgress(
  baseUri: string,
  assets: IOZAsset[],
  overwrite: boolean = false
): Promise<IOZAsset[]> {
  return window.withProgress(
    {
      location: ProgressLocation.Notification,
      title: Constants.openZeppelin.downloadingContractsFromOpenZeppelin,
    },
    async () => downloadFileSet(assets)
  );

  async function downloadFileSet(_assets: IOZAsset[]): Promise<IOZAsset[]> {
    const openZeppelinFolder = await OpenZeppelinService.getOpenZeppelinFolderPath();
    const results = await OpenZeppelinService.downloadAssetsAsync(baseUri, _assets, overwrite, openZeppelinFolder);

    let downloaded = results.filter((result) => result.state === PromiseState.fulfilled).map((result) => result.asset);

    const rejected = results.filter((result) => result.state === PromiseState.rejected).map((result) => result.asset);
    Telemetry.sendEvent("OpenZeppelinCommands.downloadFileSet.result", {
      downloadedCount: downloaded.length.toString(),
      rejectedCount: rejected.length.toString(),
    });

    if (rejected.length > 0) {
      const answer = await window.showErrorMessage(
        Constants.openZeppelin.wereNotDownloaded(rejected.length),
        Constants.openZeppelin.retryButtonTitle,
        Constants.openZeppelin.cancelButtonTitle
      );
      if (answer === Constants.openZeppelin.retryButtonTitle) {
        Output.outputLine(Constants.outputChannel.truffleSuiteForVSCode, Constants.openZeppelin.retryDownloading);
        Telemetry.sendEvent("OpenZeppelinCommands.downloadFileSet.retry", {assetsCount: rejected.length.toString()});
        downloaded = downloaded.concat(await downloadFileSet(rejected));
      }
    }

    return downloaded;
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
    }
  );
}

async function openDocumentationUrl(documentationUrl?: string): Promise<void> {
  if (!documentationUrl) {
    return;
  }

  const answer = await window.showInformationMessage(
    Constants.openZeppelin.exploreDownloadedContractsInfo,
    Constants.openZeppelin.moreDetailsButtonTitle,
    Constants.openZeppelin.cancelButtonTitle
  );

  if (answer === Constants.openZeppelin.moreDetailsButtonTitle) {
    open(documentationUrl);
  }
}
