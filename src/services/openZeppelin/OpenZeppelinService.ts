// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as download from 'download';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as url from 'url';
import { Constants } from '../../Constants';
import { TruffleConfiguration } from '../../helpers';
import { getWorkspaceRoot } from '../../helpers/workspace';
import { Output } from '../../Output';
import calculateHash from './fileHashGenerator';
import * as _metadata from './manifest.json';

const metadata = _metadata as IOZMetadata;
const projectFileName: string = 'project.json';
const categoryWithoutDocumentation = 'mocks';

export interface IOZMetadata {
  contentVersion: string;
  baseUri: string;
  categories: IOZContractCategory[];
  targetPoint: string;
  assets: IOZAsset[];
  apiDocumentationBaseUri: string;
}

export interface IOZContractCategory {
  id: string;
  name: string;
  assets: string[];
}

export interface IOZAsset {
  id: string;
  name: string;
  hash: string;
  dependencies: string[];
  type: OZAssetType;
}

export interface IProjectMetadata {
  openZeppelin: {
    assets: IOZAsset[],
  };
}

export interface IDownloadingResult {
  asset: IOZAsset;
  state: PromiseState;
}

export const enum OZAssetType {
  contract = 'contract',
  library = 'library',
  interface = 'interface',
  abstractContract = 'abstractContract',
}

export const enum PromiseState {
  fulfilled,
  rejected,
  fileExisted,
}

export class OZContractValidated {
  constructor(
    public contractPath: string,
    public isExistedOnDisk: boolean,
    public isHashValid?: boolean) {
  }
}

export namespace OpenZeppelinService {

  export function getCategories(): IOZContractCategory[] {
    return metadata.categories;
  }

  export async function downloadFiles(assets: IOZAsset[], overwrite: boolean = false): Promise<IDownloadingResult[]> {
    const openZeppelinSubfolder = getContractFolderPath();

    return Promise.all(assets.map((asset) => downloadFile(asset, overwrite, openZeppelinSubfolder)));
  }

  export async function getAllDownloadedAssets(): Promise<IOZAsset[]> {
    const projectMetadata = await getProjectJson();

    return projectMetadata.openZeppelin.assets;
  }

  export async function getReferencesToLibraries(contract: IOZAsset): Promise<IOZAsset[]> {
    const result: IOZAsset[] = [];
    const projectMetadata = await getProjectJson();

    const contractDependencies = projectMetadata.openZeppelin.assets
      .find((asset: IOZAsset) => asset.id === contract.id);
    if (!contractDependencies || contractDependencies.dependencies === undefined) {
      return result;
    }

    for (const dependencyId of contractDependencies.dependencies) {
      const dependency = metadata.assets.find((asset: IOZAsset) => asset.id === dependencyId)!;
      if (dependency.type === OZAssetType.library) {
        if (!result.includes(dependency)) {
          result.push(dependency);
        }
      } else {
        (await getReferencesToLibraries(dependency)).forEach((refs: IOZAsset) => {
          if (!result.includes(refs)) {
            result.push(refs);
          }
        });
      }
    }

    return result;
  }

  export async function addAssetsToProjectJson(downloadedAssets: IOZAsset[]) {
    const projectMetadata = await getProjectJson();
    const newStored: IOZAsset[] = [];
    newStored.push(...downloadedAssets);
    // merge two assets
    projectMetadata.openZeppelin.assets.forEach((storedAsset) => {
      if (!downloadedAssets.some((downloaded) => downloaded.id === storedAsset.id)) {
        newStored.push(storedAsset);
      }
    });
    projectMetadata.openZeppelin.assets = newStored;

    return storeProjectJson(projectMetadata);
  }

  export function collectAssetsWithDependencies(assetIds: string[] = []): IOZAsset[] {
    const dependencies: IOZAsset[] = [];
    assetIds.forEach((id) => {
      const rootAsset = metadata.assets.find((asset) => asset.id === id);
      if (rootAsset) {
        dependencies.push(rootAsset, ...collectAssetsWithDependencies(rootAsset.dependencies));
      }
    });

    return dependencies.filter((value, index, self) => self.indexOf(value) === index);
  }

  export function getAssetsStatus(assets: IOZAsset[]): { existing: IOZAsset[], missing: IOZAsset[] } {
    const openZeppelinSubfolder = getContractFolderPath();
    const assetsStatuses = assets.map((asset) => {
      const assetPath = getAssetFullPath(openZeppelinSubfolder, asset);

      return { asset, exists: fs.existsSync(assetPath) };
    });

    return {
      existing: assetsStatuses.filter((status) => status.exists === true).map((status) => status.asset),
      missing: assetsStatuses.filter((status) => status.exists === false).map((status) => status.asset),
    };
  }

  export function getCategoryApiDocumentationUrl(category: IOZContractCategory) {
    if (category.id === categoryWithoutDocumentation) {
      return undefined;
    }

    const baseUrl = appendSlashIfNotExists(metadata.apiDocumentationBaseUri);
    return url.resolve(baseUrl, category.id);
  }

  export async function validateContracts(): Promise<OZContractValidated[]> {
    const openZeppelinSubfolder = getContractFolderPath();
    const userProjectMetadata = getProjectJson();
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
}

function getProjectJson(): IProjectMetadata {
  const projectJsonPath = getProjectJsonPath();

  return fs.readJSONSync(projectJsonPath, { throws: false, encoding: 'utf8' }) ||
    { openZeppelin: { assets: [] } } as IProjectMetadata;
}

async function storeProjectJson(content: IProjectMetadata): Promise<void> {
  const projectJsonPath = getProjectJsonPath();

  return fs.writeFile(projectJsonPath, JSON.stringify(content, undefined, 2), { encoding: 'utf8' });
}

function getProjectJsonPath(): string {
  return path.join(getWorkspaceRoot()!, projectFileName);
}

function isFileExists(filePath: string) {
  try {
    return fs.lstatSync(filePath).isFile();
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

async function downloadFile(asset: IOZAsset, overwrite: boolean = false, openZeppelinSubfolder: string)
  : Promise<IDownloadingResult> {
  const fileUrl = new URL(getAssetFullPath(metadata.targetPoint, asset), metadata.baseUri).toString();
  const destinationFilePath = getAssetFullPath(openZeppelinSubfolder, asset);
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
}

function getContractFolderPath(): string {
  const truffleConfigPath = TruffleConfiguration.getTruffleConfigUri();
  const truffleConfig = new TruffleConfiguration.TruffleConfig(truffleConfigPath);
  const configuration = truffleConfig.getConfiguration();
  return path.join(getWorkspaceRoot()!, configuration.contracts_directory, 'openZeppelin');
}

function appendSlashIfNotExists(urlPath: string) {
  return urlPath[urlPath.length - 1] === '/'
    ? urlPath
    : urlPath + '/';
}

function getOzContractsFromProjectMetadata(
  openZeppelinSubfolder: string,
  userProjectMetadata: IProjectMetadata) {
    return Object.values(userProjectMetadata.openZeppelin.assets)
      .map((asset) => getAssetFullPath(openZeppelinSubfolder, asset));
}

function getOriginalHash(
  ozContractPath: string,
  openZeppelinSubfolder: string,
  userProjectMetadata: IProjectMetadata): string {
    const assetName = path.relative(openZeppelinSubfolder, ozContractPath).replace(/\\/g, '/');
    const originalAsset = userProjectMetadata.openZeppelin.assets.find((i) => i.name === assetName);
    if (originalAsset) {
      return originalAsset.hash;
    }
    return '';
}

function getAssetFullPath(baseDir: string, asset: IOZAsset) {
  return path.join(baseDir, asset.name);
}
