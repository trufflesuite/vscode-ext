// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import { ISkuDto } from "..";
import { TruffleToolsServiceClient } from "../TruffleToolsServiceClient";

export class SkuResource {
  constructor(public readonly client: TruffleToolsServiceClient) {}

  public getListSkus(): Promise<ISkuDto[]> {
    return new Promise((resolve, reject) => {
      return this.client.getSkus((error: Error | null, result?: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(Object.assign([], result.value));
        }
      });
    });
  }
}
