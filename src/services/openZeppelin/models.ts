// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

export interface IOZMetadata {
  contentVersion: string;
  baseUri: string;
  categories: IOZContractCategory[];
  targetPoint: string;
  assets: IOZAsset[];
  apiDocumentationBaseUri: string;
  openZeppelinVersion: string;
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
  type?: OZAssetType;
  contracts?: string[];
  dependencies: string[];
}

export interface IProjectMetadata {
  openZeppelin: {
    assets: IOZAsset[],
    version: string,
    categories?: string[],
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
