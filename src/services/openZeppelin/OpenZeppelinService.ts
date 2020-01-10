// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import download = require('download');
import * as fs from 'fs-extra';
import * as path from 'path';
import { Constants } from '../../Constants';
import { getWorkspaceRoot, userSettings } from '../../helpers';
import { Output } from '../../Output';
import { ContractService } from '../../services';
import { Telemetry } from '../../TelemetryClient';
import calculateHash from './fileHashGenerator';
import { CurrentOpenZeppelinVersionLocation, InvalidOpenZeppelinVersionException } from './InvalidOpenZeppelinVersionException';
import {
  IDownloadingResult,
  IOZAsset,
  IOZContractCategory,
  IProjectMetadata,
  OZAssetType,
  OZContractValidated,
  PromiseState,
} from './models';
import { OpenZeppelinManifest } from './OpenZeppelinManifest';
import { OpenZeppelinProjectJsonService } from './OpenZeppelinProjectJsonService';

const openZeppelinFolderName = 'openZeppelin';
const userTmpFolder = '.tmp';

export namespace OpenZeppelinService {
  export function projectJsonExists(): boolean {
    return getWorkspaceRoot(true) !== undefined
      && isFileExists(OpenZeppelinProjectJsonService.getProjectJsonPath());
  }

  export async function getCurrentOpenZeppelinVersionAsync(): Promise<string> {
    // If version of OZ is exist in project.json then use it,
    // otherwise use version of OZ equal 2.3.0, when project.json is exist.
    // If project.json is not exist, then use version from user settings, otherwise last version for OZ.

    const hasProjectJson = OpenZeppelinService.projectJsonExists();
    let currentVersion: string;

    if (hasProjectJson) {
      const projectMetadata = await OpenZeppelinProjectJsonService.getProjectJson();
      currentVersion = projectMetadata.openZeppelin.version || Constants.firstOZVersion;
    } else {
      const { defaultValue, userValue } = await userSettings.getConfigurationAsync(Constants.ozVersionUserSettingsKey);
      currentVersion = userValue || defaultValue;
    }

    if (Constants.allOpenZeppelinVersions.indexOf(currentVersion) === -1) {
      throw new InvalidOpenZeppelinVersionException(
        currentVersion,
        hasProjectJson
          ? CurrentOpenZeppelinVersionLocation.projectJson
          : CurrentOpenZeppelinVersionLocation.userSettings,
        Constants.openZeppelin.invalidVersionException);
    }

    return currentVersion;
  }

  export async function setVersionAsync(version: string, location: CurrentOpenZeppelinVersionLocation): Promise<void> {
    if (location === CurrentOpenZeppelinVersionLocation.projectJson) {
      await OpenZeppelinProjectJsonService.addVersionToProjectJsonAsync(version);
    } else {
      await userSettings.updateConfigurationAsync(Constants.ozVersionUserSettingsKey, version);
    }
  }

  export async function getLatestOpenZeppelinVersionAsync(): Promise<string> {
    const { defaultValue } = await userSettings.getConfigurationAsync(Constants.ozVersionUserSettingsKey);
    return defaultValue;
  }

  export async function getAllDownloadedAssetsAsync(): Promise<IOZAsset[]> {
    const projectMetadata = await OpenZeppelinProjectJsonService.getProjectJson();

    return projectMetadata.openZeppelin.assets;
  }

  export async function downloadAssetsAsync(
    baseUrl: string,
    assets: IOZAsset[],
    overwrite: boolean = false,
    destinationFolder?: string)
    : Promise<IDownloadingResult[]> {
    return Promise.all(assets.map(async (asset) => {
      const fileUrl = new URL(asset.name, baseUrl).toString();
      const destinationFilePath = getAssetFullPath(destinationFolder || await getOpenZeppelinFolderPath(), asset);
      const destinationDirPath = path.dirname(destinationFilePath);

      if (fs.existsSync(destinationFilePath)) {
        if (overwrite) {
          await fs.chmod(destinationFilePath, 0o222); // reset r/o flag, this allows to overwrite
        } else {
          Output.outputLine(Constants.outputChannel.azureBlockchain, `${fileUrl} - Skipped`);
          return { state: PromiseState.fileExisted, asset };
        }
      }

      return download(fileUrl, destinationDirPath, { filename: path.basename(destinationFilePath) })
        .then(async () => {
          Output.outputLine(Constants.outputChannel.azureBlockchain, `${fileUrl} - OK`);
          await fs.chmod(destinationFilePath, 0o444);
          return { state: PromiseState.fulfilled, asset };
        })
        .catch(() => {
          Output.outputLine(Constants.outputChannel.azureBlockchain, `${fileUrl} - Failed`);
          return { state: PromiseState.rejected, asset };
        });
    }));
  }

  export async function updateProjectJsonAsync(version: string, category: IOZContractCategory, assets: IOZAsset[])
  : Promise<void> {
    let updatedProjectJson = await OpenZeppelinProjectJsonService
      .addVersionToProjectJsonAsync(version, false);
    updatedProjectJson = await OpenZeppelinProjectJsonService
      .addCategoryToProjectJsonAsync(category, false, updatedProjectJson);
    updatedProjectJson = await OpenZeppelinProjectJsonService
      .addAssetsToProjectJsonAsync(assets, false, updatedProjectJson);

    return OpenZeppelinProjectJsonService.storeProjectJsonAsync(updatedProjectJson);
  }

  export function assetHasContracts(asset: IOZAsset): boolean {
    return (asset.type === OZAssetType.contract) || !!(asset.contracts && asset.contracts.length);
  }

  export function getContractsNamesFromAsset(asset: IOZAsset): string[] {
    if (asset.type) {
      return [getContractNameByAssetName(asset)];
    }
    if (asset.contracts && asset.contracts.length) {
      return asset.contracts.map((contract) => contract);
    }

    return [];
  }

  export function getContractNameByAssetName(asset: IOZAsset): string {
    return path.parse(asset.name).name;
  }

  export async function getAssetsStatus(assets: IOZAsset[]): Promise<{ existing: IOZAsset[], missing: IOZAsset[] }> {
    const openZeppelinSubfolder = await getOpenZeppelinFolderPath();
    const assetsStatuses = assets.map((asset) => {
      const assetPath = getAssetFullPath(openZeppelinSubfolder, asset);

      return { asset, exists: fs.existsSync(assetPath) };
    });

    return {
      existing: assetsStatuses.filter((status) => status.exists === true).map((status) => status.asset),
      missing: assetsStatuses.filter((status) => status.exists === false).map((status) => status.asset),
    };
  }

  export async function validateContractsAsync(): Promise<OZContractValidated[]> {
    const openZeppelinSubfolder = await getOpenZeppelinFolderPath();
    const userProjectMetadata = OpenZeppelinProjectJsonService.getProjectJson();
    const ozContractsPaths = getOzContractsFromProjectMetadata(openZeppelinSubfolder, userProjectMetadata);
    const validatedContracts = [];

    for (const ozContractPath of ozContractsPaths) {
      let validatedContract: OZContractValidated;
      if (isFileExists(ozContractPath)) {
        const originalHash = getOriginalHash(ozContractPath, openZeppelinSubfolder, userProjectMetadata);
        const currentHash = await calculateHash(ozContractPath);
        const isHashValid = originalHash === currentHash;
        validatedContract = new OZContractValidated(ozContractPath, true, isHashValid);
      } else {
        validatedContract = new OZContractValidated(ozContractPath, false);
      }

      validatedContracts.push(validatedContract);
    }

    return validatedContracts;
  }

  export async function updateOpenZeppelinContractsAsync(newManifest: OpenZeppelinManifest): Promise<void> {
    const userWorkspace = getWorkspaceRoot(true);

    if (userWorkspace === undefined) {
      return;
    }

    Telemetry.sendEvent('OpenZeppelinService.updateOpenZeppelinContractsAsync.started');
    const userTmpFolderPath = path.join(userWorkspace, `${userTmpFolder}${Date.now()}`);
    const tempNewOzFolder = path.join(userTmpFolderPath, 'new');
    const tempOldOzFolder = path.join(userTmpFolderPath, 'old');
    const tempNewOzContractsFolder = path.join(tempNewOzFolder, openZeppelinFolderName);

    const currentAssets = await getAllDownloadedAssetsAsync();
    const { isDownloadSucceed, newAssets } =
      await downloadNewVersionOfAssetsAsync(currentAssets, newManifest, tempNewOzContractsFolder);

    if (!isDownloadSucceed) {
      throwOpenZeppelinUpgradeException(userTmpFolderPath);
    }
    if (!newAssets.length) {
      return;
    }

    try {
      await createNewProjectJsonAsync(newManifest.getVersion(), newAssets, tempNewOzFolder);
    } catch {
      throwOpenZeppelinUpgradeException(userTmpFolderPath);
    }

    // Backup old openZeppelin data
    await moveFolderAsync(await getOpenZeppelinFolderPath(), tempOldOzFolder);
    await moveProjectJsonAsync(tempOldOzFolder, true);
    // Update new openZeppelin data
    await moveFolderAsync(tempNewOzContractsFolder, await ContractService.getSolidityContractsFolderPath());
    await moveProjectJsonAsync(tempNewOzFolder, false);

    try {
      fs.removeSync(userTmpFolderPath);
    } catch {
      // Ignore exception since upgrade is finished
    }

    Telemetry.sendEvent('OpenZeppelinService.updateOpenZeppelinContractsAsync.finished');
  }
}

function getOzContractsFromProjectMetadata(
  openZeppelinSubfolder: string,
  userProjectMetadata: IProjectMetadata)
  : string[] {
  return Object.values(userProjectMetadata.openZeppelin.assets)
    .map((asset) => getAssetFullPath(openZeppelinSubfolder, asset));
}

function getAssetFullPath(baseDir: string, asset: IOZAsset): string {
  return path.join(baseDir, asset.name);
}

function isFileExists(filePath: string): boolean {
  try {
    return fs.lstatSync(filePath).isFile();
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

function getOriginalHash(ozContractPath: string, openZeppelinSubfolder: string, userProjectMetadata: IProjectMetadata)
  : string {
  const assetName = path.relative(openZeppelinSubfolder, ozContractPath).replace(/\\/g, '/');
  const originalAsset = userProjectMetadata.openZeppelin.assets.find((i) => i.name === assetName);

  if (originalAsset) {
    return originalAsset.hash;
  }
  return '';
}

async function getOpenZeppelinFolderPath(): Promise<string> {
  return path.join(await ContractService.getSolidityContractsFolderPath(), openZeppelinFolderName);
}

async function moveFolderAsync(folderPath: string, newLocationPath: string): Promise<void> {
  await fs.ensureDir(newLocationPath);
  const newFolderPath = path.join(newLocationPath, path.basename(folderPath));
  return fs.rename(folderPath, newFolderPath);
}

async function moveProjectJsonAsync(nonUserProjectFolder: string, folderIsDestination: boolean): Promise<void> {
  const userProjectJsonPath = OpenZeppelinProjectJsonService.getProjectJsonPath();
  const nonUserProjectJsonPath = path
    .join(nonUserProjectFolder, OpenZeppelinProjectJsonService.getProjectJsonFileName());
  if (folderIsDestination) {
    return fs.rename(userProjectJsonPath, nonUserProjectJsonPath);
  }

  return fs.rename(nonUserProjectJsonPath, userProjectJsonPath);
}

async function createNewProjectJsonAsync(version: string, assets: IOZAsset[], folder: string): Promise<void> {
  let projectJson = OpenZeppelinProjectJsonService.getProjectJson();
  projectJson = await OpenZeppelinProjectJsonService.addVersionToProjectJsonAsync(version, false, projectJson);
  projectJson = await OpenZeppelinProjectJsonService.addAssetsToProjectJsonAsync(assets, false, projectJson, true);
  const newPath = path.join(folder, OpenZeppelinProjectJsonService.getProjectJsonFileName());

  return OpenZeppelinProjectJsonService.storeProjectJsonAsync(projectJson, newPath);
}

function throwOpenZeppelinUpgradeException(tempFolder: string): void {
  fs.removeSync(tempFolder);
  throw new Error(Constants.openZeppelin.contractsUpgradeIsFailed);
}

async function downloadNewVersionOfAssetsAsync(
  assets: IOZAsset[],
  newManifest: OpenZeppelinManifest,
  toFolder: string)
: Promise<{ isDownloadSucceed: boolean, newAssets: IOZAsset[] }> {
  if (!assets.length) {
    return { isDownloadSucceed: true, newAssets: [] };
  }

  const assetIdsToDownload = newManifest.getAssets()
    .filter((newAsset) => assets.some((asset) => asset.name === newAsset.name)) // Search by name match
    .map((asset) => asset.id);

  if (!assetIdsToDownload.length) {
    return { isDownloadSucceed: true, newAssets: [] };
  }

  const newAssets = newManifest.collectAssetsWithDependencies(assetIdsToDownload);
  const sourceUrl = newManifest.getBaseUrlToContractsSource();

  const downloadResult = await OpenZeppelinService.downloadAssetsAsync(sourceUrl, newAssets, true, toFolder);
  const isDownloadFailed = downloadResult.some((result) => result.state === PromiseState.rejected);

  if (isDownloadFailed) {
    return { isDownloadSucceed: false, newAssets: [] };
  }

  return { isDownloadSucceed: true, newAssets };
}
