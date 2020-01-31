// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
  IAzureBlockchainDataManagerApplicationDto,
  IAzureBlockchainDataManagerDto,
  IAzureBlockchainDataManagerInputDto,
  IAzureBlockchainDataManagerOutputDto,
} from '..';
import { AzureBlockchainServiceClient } from '../AzureBlockchainServiceClient';

export class BlockchainDataManagerResource {
  constructor(public readonly client: AzureBlockchainServiceClient) {}
  public async getListBlockchainDataManager(): Promise<IAzureBlockchainDataManagerDto[]> {
    return new Promise((resolve, reject) => {
      return this.client.getBlockchainDataManagers((error: Error | null, result?: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(Object.assign([], result.value));
        }
      });
    });
  }

  public async getListBlockchainDataManagerApplication(bdmName: string)
  : Promise<IAzureBlockchainDataManagerApplicationDto[]> {
    return new Promise((resolve, reject) => {
      return this.client.getBlockchainDataManagerApplications(bdmName, (error: Error | null, result?: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(Object.assign([], result.value));
        }
      });
    });
  }

  public async getListBlockchainDataManagerInput(bdmName: string)
  : Promise<IAzureBlockchainDataManagerInputDto[]> {
    return new Promise((resolve, reject) => {
      return this.client.getBlockchainDataManagerInputs(bdmName, (error: Error | null, result?: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(Object.assign([], result.value));
        }
      });
    });
  }

  public async getListBlockchainDataManagerOutput(bdmName: string)
  : Promise<IAzureBlockchainDataManagerOutputDto[]> {
    return new Promise((resolve, reject) => {
      return this.client.getBlockchainDataManagerOutputs(bdmName, (error: Error | null, result?: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(Object.assign([], result.value));
        }
      });
    });
  }
}
