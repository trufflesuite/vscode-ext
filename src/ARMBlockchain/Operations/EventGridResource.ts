// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import { IEventGridDto } from "../AzureDto/EventGridDto";
import { EventGridManagementClient } from "../EventGridManagementClient";

export class EventGridResource {
  constructor(public readonly client: EventGridManagementClient) {}

  public async getEventGridList(): Promise<IEventGridDto[]> {
    return new Promise((resolve, reject) => {
      return this.client.getEventGridList((error: Error | null, result?: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(Object.assign([], result.value));
        }
      });
    });
  }

  public async getEventGridItem(eventGridName: string): Promise<IEventGridDto> {
    return new Promise((resolve, reject) => {
      return this.client.getEventGridItem(eventGridName, (error: Error | null, result?: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(Object.assign([], result));
        }
      });
    });
  }

  public async createEventGrid(eventGridName: string, body: string): Promise<IEventGridDto> {
    return new Promise((resolve, reject) => {
      return this.client.createEventGrid(eventGridName, body, (error: Error | null, result?: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(Object.assign([], result));
        }
      });
    });
  }
}
