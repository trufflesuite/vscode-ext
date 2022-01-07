// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {
  IAzureBlockchainDataManagerApplicationDto,
  IAzureBlockchainDataManagerDto,
  IAzureBlockchainDataManagerInputDto,
  IAzureBlockchainDataManagerOutputDto,
  ICreateBlockchainDataManagerApplicationDto,
  ICreateBlockchainDataManagerDto,
  ICreateBlockchainDataManagerInputDto,
  ICreateBlockchainDataManagerOutputDto,
} from "..";
import { AzureBlockchainServiceClient } from "../AzureBlockchainServiceClient";

export class BlockchainDataManagerResource {
  constructor(public readonly client: AzureBlockchainServiceClient) {}

  public async getBlockchainDataManagerList(): Promise<IAzureBlockchainDataManagerDto[]> {
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

  public async getBlockchainDataManagerInputList(bdmName: string): Promise<IAzureBlockchainDataManagerInputDto[]> {
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

  public async getBlockchainDataManagerOutputList(bdmName: string): Promise<IAzureBlockchainDataManagerOutputDto[]> {
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

  public createBlockchainDataManager(
    bdmName: string,
    body: ICreateBlockchainDataManagerDto
  ): Promise<IAzureBlockchainDataManagerDto> {
    return new Promise((resolve, reject) => {
      return this.client.createBlockchainDataManager(
        bdmName,
        JSON.stringify(body),
        (error: Error | null, result?: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(Object.assign([], result));
          }
        }
      );
    });
  }

  public createBlockchainDataManagerInput(
    bdmName: string,
    transactionNodeName: string,
    body: ICreateBlockchainDataManagerInputDto
  ): Promise<IAzureBlockchainDataManagerInputDto> {
    return new Promise((resolve, reject) => {
      return this.client.createBlockchainDataManagerInput(
        bdmName,
        transactionNodeName,
        JSON.stringify(body),
        (error: Error | null, result?: any) => {
          if (error) {
            this.removeBlockchainDataManager(bdmName);
            reject(error);
          } else {
            resolve(Object.assign([], result));
          }
        }
      );
    });
  }

  public createBlockchainDataManagerOutput(
    bdmName: string,
    connectionName: string,
    body: ICreateBlockchainDataManagerOutputDto
  ): Promise<IAzureBlockchainDataManagerOutputDto> {
    return new Promise((resolve, reject) => {
      return this.client.createBlockchainDataManagerOutput(
        bdmName,
        connectionName,
        JSON.stringify(body),
        (error: Error | null, result?: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(Object.assign([], result));
          }
        }
      );
    });
  }

  public createBlockchainDataManagerApplication(
    bdmName: string,
    applicationName: string,
    body: ICreateBlockchainDataManagerApplicationDto
  ): Promise<IAzureBlockchainDataManagerApplicationDto> {
    return new Promise((resolve, reject) => {
      return this.client.createBlockchainDataManagerApplication(
        bdmName,
        applicationName,
        JSON.stringify(body),
        (error: Error | null, result?: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(Object.assign([], result));
          }
        }
      );
    });
  }

  public async getBlockchainDataManagerApplicationList(
    bdmName: string
  ): Promise<IAzureBlockchainDataManagerApplicationDto[]> {
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

  public async getBlockchainDataManagerApplication(
    bdmName: string,
    applicationName: string
  ): Promise<IAzureBlockchainDataManagerApplicationDto> {
    return new Promise((resolve, reject) => {
      return this.client.getBlockchainDataManagerApplication(
        bdmName,
        applicationName,
        (error: Error | null, result?: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(Object.assign([], result));
          }
        }
      );
    });
  }

  public async deleteBlockchainDataManagerApplication(bdmName: string, applicationName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      return this.client.deleteBlockchainDataManagerApplication(
        bdmName,
        applicationName,
        (error: Error | null, result?: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(Object.assign([], result));
          }
        }
      );
    });
  }

  public startBlockchainDataManager(bdmName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      return this.client.startBlockchainDataManager(bdmName, (error: Error | null, result?: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(Object.assign([], result));
        }
      });
    });
  }

  private removeBlockchainDataManager(bdmName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      return this.client.removeBlockchainDataManager(bdmName, (error: Error | null, result?: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(Object.assign([], result));
        }
      });
    });
  }
}
