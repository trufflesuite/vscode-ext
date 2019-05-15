// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ConsortiumResourceExplorer } from '../ConsortiumResourceExplorer';
import { Constants } from '../Constants';
import { TruffleConfiguration } from '../helpers';
import { ItemType } from './ItemType';
import { ProtectedConsortium } from './ProtectedConsortium';

export class AzureConsortium extends ProtectedConsortium {
  private readonly subscriptionId: string;
  private readonly resourcesGroup: string;
  private readonly memberName: string;

  constructor(
    consortiumName: string,
    subscriptionId: string,
    resourcesGroup: string,
    memberName: string,
    url?: string,
  ) {
    super(ItemType.AZURE_CONSORTIUM, consortiumName);

    this.subscriptionId = subscriptionId;
    this.resourcesGroup = resourcesGroup;
    this.memberName = memberName;

    if (url) {
      this.addUrl(url);
    }
  }

  public async getTruffleNetwork(): Promise<TruffleConfiguration.INetwork> {
    const network = await super.getTruffleNetwork();

    network.options.gasPrice = 0;
    network.options.gas = 0;

    return network;
  }

  public getSubscriptionId(): string {
    return this.subscriptionId;
  }

  public getResourceGroup(): string {
    return this.resourcesGroup;
  }

  public getMemberName(): string {
    return this.memberName;
  }

  public async getRPCAddress(): Promise<string> {
    const url = this.getUrls()[0];
    if (!url) {
      return '';
    }

    if (!url.port) {
      url.port = `${Constants.defaultAzureBSPort}`;
    }

    const consortiumResourceExplorer = new ConsortiumResourceExplorer();
    const keys = await consortiumResourceExplorer.getAccessKeys(this);
    return keys ? `${url.origin}/${keys[0]}` : url.origin;
  }

  public toJSON(): { [p: string]: any } {
    const obj = super.toJSON();

    obj.subscriptionId = this.subscriptionId;
    obj.resourcesGroup = this.resourcesGroup;
    obj.memberName = this.memberName;

    return obj;
  }
}
