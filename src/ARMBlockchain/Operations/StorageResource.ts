// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { IStorageAccountDto } from '../AzureDto/StorageAccount/StorageAccountDto';
import { IStorageAccountSasDto } from '../AzureDto/StorageAccount/StorageAccountSasDto';
import { StorageAccountClient } from '../StorageAccountClient';

export class StorageResource {
  constructor(public readonly client: StorageAccountClient) {}

  public async getStorageAccountList(): Promise<IStorageAccountDto[]> {
    return new Promise((resolve, reject) => {
      return this.client.getStorageAccountList((error: Error | null, result?: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(Object.assign([], result.value));
        }
      });
    });
  }

  public async getListAccountSas(name: string, body: string): Promise<IStorageAccountSasDto> {
    return new Promise((resolve, reject) => {
      return this.client.getListAccountSas(name, body, (error: Error | null, result?: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(Object.assign([], result));
        }
      });
    });
  }

  public async createStorageAccount(accountName: string, body: string): Promise<void> {
    return new Promise((resolve, reject) => {
      return this.client.createStorageAccount(accountName, body, (error: Error | null, result?: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(Object.assign([], result));
        }
      });
    });
  }

  public async getStorageAccount(accountName: string): Promise<IStorageAccountDto> {
    return new Promise((resolve, reject) => {
      return this.client.getStorageAccount(accountName, (error: Error | null, result?: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(Object.assign([], result));
        }
      });
    });
  }
}
