// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import { IAzureTransactionNodeDto, ICreateTransactionNodeDto } from "..";
import { AzureBlockchainServiceClient } from "../AzureBlockchainServiceClient";
import { IAzureMemberAccessKeysDto } from "../AzureDto/AccessKeysDto";

export class TransactionNodeResource {
  constructor(public readonly client: AzureBlockchainServiceClient) {}

  public getTransactionNodeList(memberName: string): Promise<IAzureTransactionNodeDto[]> {
    return new Promise((resolve, reject) => {
      return this.client.getTransactionNodes(memberName, (error: Error | null, result?: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(Object.assign([], result.value));
        }
      });
    });
  }

  public getTransactionNode(memberName: string, transactionNodeName: string): Promise<IAzureTransactionNodeDto> {
    return new Promise((resolve, reject) => {
      return this.client.getTransactionNode(memberName, transactionNodeName, (error: Error | null, result?: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(Object.assign([], result));
        }
      });
    });
  }

  public createTransactionNode(
    memberName: string,
    transactionNodeName: string,
    body: ICreateTransactionNodeDto
  ): Promise<IAzureTransactionNodeDto> {
    return new Promise((resolve, reject) => {
      return this.client.createTransactionNode(
        memberName,
        transactionNodeName,
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

  public getTransactionNodeAccessKeys(memberName: string, nodeName: string): Promise<IAzureMemberAccessKeysDto> {
    return new Promise((resolve, reject) => {
      return this.client.getTransactionNodeAccessKeys(memberName, nodeName, (error: Error | null, result?: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }
}
