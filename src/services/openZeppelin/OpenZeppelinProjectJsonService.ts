// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as fs from 'fs-extra';
import * as path from 'path';
import { Constants } from '../../Constants';
import { getWorkspaceRoot } from '../../helpers';
import {
  IOZAsset,
  IOZContractCategory,
  IProjectMetadata,
  OZAssetType,
} from './models';

const projectFileName: string = 'project.json';

export namespace OpenZeppelinProjectJsonService {
  export function getProjectJson(): IProjectMetadata {
    const projectJsonPath = getProjectJsonPath();

    return fs.readJSONSync(projectJsonPath, { throws: false, encoding: 'utf8' }) ||
      { openZeppelin: { assets: [], version: '' } } as IProjectMetadata;
  }

  export function getProjectJsonPath(): string {
    return path.join(getWorkspaceRoot()!, projectFileName);
  }

  export function getProjectJsonFileName(): string {
    return projectFileName;
  }

  export async function getReferencesToLibrariesAsync(contract: IOZAsset): Promise<IOZAsset[]> {
    const result: IOZAsset[] = [];
    const projectMetadata = await getProjectJson();
    const projectAssets = projectMetadata.openZeppelin.assets;
    const contractDependencies = projectAssets.find((asset: IOZAsset) => asset.id === contract.id);

    if (!contractDependencies || contractDependencies.dependencies === undefined) {
      return result;
    }

    for (const dependencyId of contractDependencies.dependencies) {
      const dependency = projectAssets.find((asset: IOZAsset) => asset.id === dependencyId)!;

      if (dependency.type === OZAssetType.library) {
        if (!result.includes(dependency)) {
          result.push(dependency);
          continue;
        }
      } else {
        (await getReferencesToLibrariesAsync(dependency)).forEach((refs: IOZAsset) => {
          if (!result.includes(refs)) {
            result.push(refs);
          }
        });
      }
    }

    return result;
  }

  export async function addAssetsToProjectJsonAsync(
    downloadedAssets: IOZAsset[],
    projectMetadata: IProjectMetadata)
  : Promise<IProjectMetadata> {
    const newStored: IOZAsset[] = [];
    newStored.push(...downloadedAssets);

    projectMetadata.openZeppelin.assets.forEach((storedAsset) => {
      if (!downloadedAssets.some((downloaded) => downloaded.id === storedAsset.id)) {
        newStored.push(storedAsset);
      }
    });

    projectMetadata.openZeppelin.assets = newStored;

    return projectMetadata;
  }

  export async function addVersionToProjectJsonAsync(
    version: string,
    makePersist: boolean = true,
    updatingProjectMetadata?: IProjectMetadata)
  : Promise<IProjectMetadata> {
    const projectMetadata = updatingProjectMetadata || await getProjectJson();
    projectMetadata.openZeppelin.version = version;

    if (makePersist) {
      await storeProjectJsonAsync(projectMetadata);
    }

    return projectMetadata;
  }

  export async function addCategoryToProjectJsonAsync(
    category: IOZContractCategory,
    makePersist: boolean = true,
    updatingProjectMetadata?: IProjectMetadata)
  : Promise<IProjectMetadata> {
    const projectMetadata = updatingProjectMetadata || await getProjectJson();

    if (!projectMetadata.openZeppelin.version || projectMetadata.openZeppelin.version === Constants.firstOZVersion) {
      return projectMetadata;
    }

    projectMetadata.openZeppelin.categories = projectMetadata.openZeppelin.categories || [];

    if (projectMetadata.openZeppelin.categories.indexOf(category.id) === -1) {
      projectMetadata.openZeppelin.categories.push(category.id);
    }

    if (makePersist) {
      await storeProjectJsonAsync(projectMetadata);
    }

    return projectMetadata;
  }

  export async function storeProjectJsonAsync(content: IProjectMetadata, destinationPath?: string): Promise<void> {
    const projectJsonPath = getProjectJsonPath();

    return fs
      .writeFile(destinationPath || projectJsonPath, JSON.stringify(content, undefined, 2), { encoding: 'utf8' });
  }
}
