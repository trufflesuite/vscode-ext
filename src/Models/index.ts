// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

export * from './CancellationEvent';
export * from './EnumStorage';
export * from './ItemFactory';
export * from './ItemType';
import {
  AzureBlockchainNetworkNodeItemCreator,
  AzureBlockchainProjectItemCreator,
  AzureBlockchainServiceItemCreator,
  CommandItemCreator,
  LocalNetworkNodeItemCreator,
  LocalProjectItemCreator,
  LocalServiceItemCreator,
  MemberItemCreator,
  NullableItemCreator,
} from './ItemCreators';
import { ItemFactory } from './ItemFactory';
import { ItemType } from './ItemType';

ItemFactory.register(ItemType.COMMAND, new CommandItemCreator());
ItemFactory.register(ItemType.NULLABLE, new NullableItemCreator());

ItemFactory.register(ItemType.AZURE_BLOCKCHAIN_SERVICE, new AzureBlockchainServiceItemCreator());
ItemFactory.register(ItemType.LOCAL_SERVICE, new LocalServiceItemCreator());

ItemFactory.register(ItemType.AZURE_BLOCKCHAIN_PROJECT, new AzureBlockchainProjectItemCreator());
ItemFactory.register(ItemType.LOCAL_PROJECT, new LocalProjectItemCreator());

ItemFactory.register(ItemType.AZURE_BLOCKCHAIN_NETWORK_NODE, new AzureBlockchainNetworkNodeItemCreator());
ItemFactory.register(ItemType.LOCAL_NETWORK_NODE, new LocalNetworkNodeItemCreator());

ItemFactory.register(ItemType.MEMBER, new MemberItemCreator());
