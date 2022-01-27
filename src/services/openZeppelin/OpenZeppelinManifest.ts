// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import url from "url";
import {IOZAsset, IOZContractCategory, IOZMetadata} from "./models";

const categoryWithoutDocumentation = "mocks";

export class OpenZeppelinManifest {
  private metadata: IOZMetadata;

  constructor(metadata: IOZMetadata) {
    this.metadata = metadata;
  }

  public getVersion(): string {
    return this.metadata.openZeppelinVersion;
  }

  public getCategories(): IOZContractCategory[] {
    return this.metadata.categories;
  }

  public getAssets(): IOZAsset[] {
    return this.metadata.assets;
  }

  public collectAssetsWithDependencies(assetIds: string[] = []): IOZAsset[] {
    const dependencies: IOZAsset[] = [];
    assetIds.forEach((id) => {
      const rootAsset = this.metadata.assets.find((asset) => asset.id === id);
      if (rootAsset) {
        dependencies.push(rootAsset, ...this.collectAssetsWithDependencies(rootAsset.dependencies));
      }
    });

    return dependencies.filter((value, index, self) => self.indexOf(value) === index);
  }

  public getCategoryApiDocumentationUrl(category: IOZContractCategory) {
    if (category.id === categoryWithoutDocumentation) {
      return undefined;
    }

    const baseUrl = this.appendSlashIfNotExists(this.metadata.apiDocumentationBaseUri);
    return url.resolve(baseUrl, category.id);
  }

  public getBaseUrlToContractsSource(): string {
    const baseUrl = this.appendSlashIfNotExists(this.metadata.baseUri);
    return url.resolve(baseUrl, this.metadata.targetPoint);
  }

  private appendSlashIfNotExists(urlPath: string) {
    return urlPath[urlPath.length - 1] === "/" ? urlPath : urlPath + "/";
  }
}
