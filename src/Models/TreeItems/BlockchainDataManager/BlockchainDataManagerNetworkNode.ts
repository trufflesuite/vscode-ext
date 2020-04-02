// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Constants } from '../../../Constants';
import { ItemType } from '../../ItemType';
import { ExtensionItemData } from '../ExtensionItem';
import { NetworkNode } from '../NetworkNode';

const { application, input, output } = Constants.treeItemData.network.bdm;

export class BlockchainDataManagerNetworkNode extends NetworkNode {
  public readonly subscriptionId: string;
  public readonly resourceGroup: string;
  public readonly fileUrls: string[];

  constructor(
    label: string,
    networkId: number | string,
    subscriptionId: string,
    resourceGroup: string,
    fileUrls: string[],
    itemType: ItemType.BLOCKCHAIN_DATA_MANAGER_APPLICATION |
      ItemType.BLOCKCHAIN_DATA_MANAGER_INPUT |
      ItemType.BLOCKCHAIN_DATA_MANAGER_OUTPUT,
    url: string,
  ) {
    const data: ExtensionItemData =
      itemType === ItemType.BLOCKCHAIN_DATA_MANAGER_APPLICATION ? application :
        itemType === ItemType.BLOCKCHAIN_DATA_MANAGER_INPUT ? input : output;

    super(
      itemType,
      label,
      data,
      url,
      networkId,
    );

    this.subscriptionId = subscriptionId;
    this.resourceGroup = resourceGroup;
    this.fileUrls = fileUrls;
  }

  public toJSON(): { [key: string]: any } {
    const obj = super.toJSON();

    obj.subscriptionId = this.subscriptionId;
    obj.resourceGroup = this.resourceGroup;
    obj.fileUrls = this.fileUrls;

    return obj;
  }

  protected async getGasPrice(): Promise<number | undefined> {
    return 0;
  }

  protected async getGasLimit(): Promise<number | undefined> {
    return 0;
  }

  protected defaultProtocol(): string {
    return Constants.networkProtocols.http;
  }
}
